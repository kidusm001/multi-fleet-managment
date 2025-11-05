import express, { Request, Response } from 'express';
import { Driver, Prisma, RouteStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateDriver, CreateDriverSchema, DriverIdParam, UpdateDriverSchema } from '../schema/driverSchema';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import prisma from '../db';
import { driverNotifications } from '../lib/notificationHelpers';
import { broadcastNotification } from '../lib/notificationBroadcaster';
import {
    AnnotatedRoute,
    annotateRouteWithStatuses,
    DriverFacingStatus,
    resolveRouteStartTime,
    SchedulableRoute,
} from '../utils/routeStatus';

const router = express.Router();

type DriverList = Driver[];

const driverInclude = {
    organization: true,
    assignedVehicles: {
        where: {
            deleted: false,
        },
        select: {
            id: true,
            name: true,
            plateNumber: true,
            status: true,
            capacity: true,
        },
    },
} as const;

const scheduleRouteInclude = Prisma.validator<Prisma.RouteInclude>()({
    shift: {
        select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            timeZone: true,
        },
    },
    vehicle: {
        select: {
            id: true,
            name: true,
            plateNumber: true,
            status: true,
            capacity: true,
        },
    },
    location: {
        select: {
            id: true,
            address: true,
            type: true,
            longitude: true,
            latitude: true,
        },
    },
    source: {
        select: {
            id: true,
            address: true,
            type: true,
            longitude: true,
            latitude: true,
        },
    },
    vehicleAvailability: true,
    stops: {
        include: {
            employee: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            order: 'asc',
        },
    },
});

type RouteForSchedule = Prisma.RouteGetPayload<{ include: typeof scheduleRouteInclude }> & {
    isVirtual?: boolean;
    originalRouteId?: string | null;
};

class HttpError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

async function syncVehicleAssignment(
    tx: Prisma.TransactionClient,
    {
        driverId,
        organizationId,
        vehicleId,
    }: {
        driverId: string;
        organizationId: string;
        vehicleId: string | null | undefined;
    },
) {
    if (vehicleId === undefined) {
        return;
    }

    await tx.vehicle.updateMany({
        where: {
            organizationId,
            driverId,
            ...(vehicleId ? { id: { not: vehicleId } } : {}),
        },
        data: { driverId: null },
    });

    if (vehicleId === null) {
        return;
    }

    const vehicle = await tx.vehicle.findFirst({
        where: {
            id: vehicleId,
            organizationId,
            deleted: false,
        },
        select: { id: true },
    });

    if (!vehicle) {
        throw new HttpError(404, 'Vehicle not found');
    }

    await tx.vehicle.update({
        where: { id: vehicleId },
        data: { driverId },
    });
}

function mapDriverResponse(driver: any) {
    const { assignedVehicles = [], ...rest } = driver;
    const vehicle = Array.isArray(assignedVehicles) ? assignedVehicles[0] : null;

    const shuttle = vehicle
        ? {
            id: vehicle.id,
            name: vehicle.name || vehicle.plateNumber,
            licensePlate: vehicle.plateNumber,
            plateNumber: vehicle.plateNumber,
            status: vehicle.status,
            capacity: vehicle.capacity,
        }
        : null;

    return {
        ...rest,
        shuttleId: shuttle?.id ?? null,
        shuttle,
    };
}

// Resolve the driver entity linked to the authenticated user via shared contact info.
async function findDriverProfileForRequest(req: Request) {
    const user = req.user;
    if (!user) {
        return null;
    }

    const activeOrganizationId = req.session?.session?.activeOrganizationId || req.activeOrganizationId || undefined;

    const identifierFilters: Prisma.DriverWhereInput[] = [];

    if (typeof user.email === 'string' && user.email.trim()) {
        identifierFilters.push({ email: user.email.trim() });
    }

    const possiblePhones = [user.phone, user.phoneNumber, user.phone_number].filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);
    for (const phone of possiblePhones) {
        identifierFilters.push({ phoneNumber: phone.trim() });
    }

    if (identifierFilters.length === 0) {
        return null;
    }

    const whereClause: Prisma.DriverWhereInput = {
        deleted: false,
        OR: identifierFilters
    };

    if (activeOrganizationId) {
        whereClause.organizationId = activeOrganizationId;
    }

    let driverProfile = await prisma.driver.findFirst({ where: whereClause });

    if (!driverProfile && !activeOrganizationId) {
        driverProfile = await prisma.driver.findFirst({
            where: {
                deleted: false,
                OR: identifierFilters
            }
        });
    }

    return driverProfile;
}

const startOfDay = (input: Date): Date => {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
};

const endOfDay = (input: Date): Date => {
    const date = new Date(input);
    date.setHours(23, 59, 59, 999);
    return date;
};

const addDays = (input: Date, days: number): Date => {
    const date = new Date(input);
    date.setDate(date.getDate() + days);
    return date;
};

const formatDateKey = (input: Date): string => {
    const year = input.getFullYear();
    const month = `${input.getMonth() + 1}`.padStart(2, '0');
    const day = `${input.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isWeekend = (input: Date): boolean => {
    const day = input.getDay();
    return day === 0 || day === 6;
};

const combineDateAndTime = (datePart: Date, timeSource: Date | null | undefined): Date | null => {
    if (!timeSource) {
        return null;
    }

    const result = new Date(datePart);
    const time = new Date(timeSource);
    result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
    return result;
};

const resolveRouteDate = (route: SchedulableRoute): Date | null => {
    if (route.date) {
        return new Date(route.date);
    }

    if (route.startTime) {
        return startOfDay(new Date(route.startTime));
    }

    if (route.shift?.startTime) {
        return startOfDay(new Date(route.shift.startTime));
    }

    return null;
};

const createVirtualRoute = (template: RouteForSchedule, targetDate: Date, index: number): RouteForSchedule => {
    const baseDate = startOfDay(targetDate);
    const dateKey = formatDateKey(baseDate);
    const startReference = resolveRouteStartTime(template);
    const endReference = template.endTime ? new Date(template.endTime) : template.shift?.endTime ? new Date(template.shift.endTime) : null;

    const virtualId = `virtual-${template.id}-${dateKey}-${index}`;

    return {
        ...template,
        id: virtualId,
        originalRouteId: template.id,
        isVirtual: true,
        status: 'PENDING',
        date: baseDate,
        startTime: combineDateAndTime(baseDate, startReference),
        endTime: combineDateAndTime(baseDate, endReference),
        createdAt: baseDate,
        updatedAt: baseDate,
        stops: template.stops.map((stop, stopIndex) => ({
            ...stop,
            id: `virtual-stop-${stop.id}-${dateKey}-${stopIndex}`,
            completedAt: null,
            notes: null,
        })),
        vehicleAvailability: [],
    };
};

const sortRoutesForSchedule = (routes: RouteForSchedule[]): RouteForSchedule[] => {
    return routes.sort((a, b) => {
        const dateA = resolveRouteDate(a)?.getTime() ?? 0;
        const dateB = resolveRouteDate(b)?.getTime() ?? 0;
        if (dateA !== dateB) {
            return dateA - dateB;
        }

        const startA = resolveRouteStartTime(a)?.getTime() ?? 0;
        const startB = resolveRouteStartTime(b)?.getTime() ?? 0;
        return startA - startB;
    });
};

type ScheduleWindow = {
    driverProfile: Driver;
    startDate: Date;
    endDate: Date;
};

const buildDriverSchedule = async ({
    driverProfile,
    startDate,
    endDate,
}: ScheduleWindow): Promise<AnnotatedRoute<RouteForSchedule>[]> => {
    const templateWindowStart = addDays(startDate, -28);

    // Get driver's assigned vehicle if any
    const driverVehicle = await prisma.vehicle.findFirst({
        where: {
            driverId: driverProfile.id,
            deleted: false,
        },
        select: {
            id: true,
            name: true,
            plateNumber: true,
            status: true,
            capacity: true,
        },
    });

    const driverRoutes = await prisma.route.findMany({
        where: {
            organizationId: driverProfile.organizationId,
            deleted: false,
            vehicle: {
                driverId: driverProfile.id,
            },
            OR: [
                {
                    date: {
                        gte: templateWindowStart,
                        lte: endDate,
                    },
                },
                {
                    AND: [
                        { date: null },
                        {
                            startTime: {
                                gte: templateWindowStart,
                                lte: endDate,
                            },
                        },
                    ],
                },
            ],
        },
        include: scheduleRouteInclude,
        orderBy: [
            { date: 'asc' },
            { startTime: 'asc' },
            { createdAt: 'asc' },
        ],
    });

    const activeRouteDefinitions = await prisma.route.findMany({
        where: {
            organizationId: driverProfile.organizationId,
            deleted: false,
            isActive: true,
            vehicle: {
                driverId: driverProfile.id,
            },
        },
        include: scheduleRouteInclude,
    });

    const recurringTemplateMap = new Map<string, RouteForSchedule>();

    activeRouteDefinitions.forEach((route) => {
        recurringTemplateMap.set(route.id, route);
    });

    driverRoutes.forEach((route) => {
        if (recurringTemplateMap.has(route.id)) {
            recurringTemplateMap.set(route.id, route);
        }
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
            organizationId: driverProfile.organizationId,
            date: {
                gte: templateWindowStart,
                lte: endDate,
            },
            OR: [
                { driverId: driverProfile.id },
                {
                    driverId: null,
                    vehicle: {
                        driverId: driverProfile.id,
                    },
                },
            ],
        },
        select: {
            id: true,
            date: true,
            vehicleId: true,
        },
    });

    const attendanceByVehicle = new Set<string>();
    const attendanceByDate = new Set<string>();

    attendanceRecords.forEach((record) => {
        const recordDate = new Date(record.date);
        if (Number.isNaN(recordDate.getTime())) {
            return;
        }

        const dateKey = formatDateKey(recordDate);
        attendanceByDate.add(dateKey);
        if (record.vehicleId) {
            attendanceByVehicle.add(`${dateKey}::${record.vehicleId}`);
        }
    });

    const recurringTemplates = Array.from(recurringTemplateMap.values());

    const unavailableBlocks = await prisma.vehicleAvailability.findMany({
        where: {
            organizationId: driverProfile.organizationId,
            driverId: driverProfile.id,
            available: false,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            date: true,
            routeId: true,
            shiftId: true,
        },
    });

    const holidaySet = new Set<string>(
        unavailableBlocks
            .filter((entry) => !entry.routeId && !entry.shiftId)
            .map((entry) => formatDateKey(startOfDay(new Date(entry.date)))),
    );

    const scheduleByDate = new Map<string, RouteForSchedule[]>();
    const templatesByWeekday = new Map<number, RouteForSchedule[]>();

    for (const route of driverRoutes) {
        const routeDate = resolveRouteDate(route);
        if (!routeDate) {
            continue;
        }

        const weekday = routeDate.getDay();
        if (!templatesByWeekday.has(weekday)) {
            templatesByWeekday.set(weekday, []);
        }
        templatesByWeekday.get(weekday)!.push(route);

        if (routeDate >= startDate && routeDate <= endDate) {
            const dateKey = formatDateKey(routeDate);
            if (!scheduleByDate.has(dateKey)) {
                scheduleByDate.set(dateKey, []);
            }
            scheduleByDate.get(dateKey)!.push(route);
        }
    }

    templatesByWeekday.forEach((list, index) => {
        templatesByWeekday.set(index, sortRoutesForSchedule(list));
    });

    scheduleByDate.forEach((list, key) => {
        scheduleByDate.set(key, sortRoutesForSchedule(list));
    });

    const synthesizedSchedule: RouteForSchedule[] = [];
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    for (let offset = 0; offset < dayCount; offset += 1) {
        const currentDate = addDays(startDate, offset);
        const dateKey = formatDateKey(currentDate);
        const actualRoutesForDay = scheduleByDate.get(dateKey) ?? [];

        if (actualRoutesForDay.length > 0) {
            synthesizedSchedule.push(...actualRoutesForDay);
        }

        if (isWeekend(currentDate) || holidaySet.has(dateKey)) {
            continue;
        }

        const existingRouteIds = new Set<string>();
        actualRoutesForDay.forEach((route) => {
            existingRouteIds.add(route.originalRouteId ?? route.id);
        });

        const candidateTemplates: RouteForSchedule[] = [];
        const candidateIds = new Set<string>();

        const weekdayTemplates = templatesByWeekday.get(currentDate.getDay());
        if (weekdayTemplates) {
            weekdayTemplates.forEach((template) => {
                if (!candidateIds.has(template.id)) {
                    candidateTemplates.push(template);
                    candidateIds.add(template.id);
                }
            });
        }

        recurringTemplates.forEach((template) => {
            if (!candidateIds.has(template.id)) {
                candidateTemplates.push(template);
                candidateIds.add(template.id);
            }
        });

        candidateTemplates.sort((a, b) => {
            const startA = resolveRouteStartTime(a)?.getTime() ?? 0;
            const startB = resolveRouteStartTime(b)?.getTime() ?? 0;
            return startA - startB;
        });

        candidateTemplates.forEach((template, templateIndex) => {
            if (existingRouteIds.has(template.id)) {
                return;
            }

            synthesizedSchedule.push(createVirtualRoute(template, currentDate, templateIndex));
        });
    }

    const now = new Date();
    const sortedSchedule = sortRoutesForSchedule([...synthesizedSchedule]);

    const scheduleWithAttendance = sortedSchedule.map((route) => {
        const routeDate = resolveRouteDate(route);

        if (!routeDate) {
            return {
                ...route,
                hasAttendanceRecord: false,
                vehicle: route.vehicle || driverVehicle || null,
            };
        }

        const dateKey = formatDateKey(routeDate);
        const vehicleIdentifier = route.vehicleId || route.vehicle?.id || null;
        const vehicleKey = vehicleIdentifier ? `${dateKey}::${vehicleIdentifier}` : null;

        const hasAttendanceRecord =
            (vehicleKey && attendanceByVehicle.has(vehicleKey)) || attendanceByDate.has(dateKey);

        return {
            ...route,
            hasAttendanceRecord,
            vehicle: route.vehicle || driverVehicle || null,
        };
    });

    const annotated = scheduleWithAttendance.map((route) => {
        return annotateRouteWithStatuses(route, now);
    });

    return annotated;
};

/**
 * @route   GET /superadmin
 * @desc    Get all drivers
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { includeDeleted } = req.query;
        const drivers: DriverList = await prisma.driver.findMany({
            where: {
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(drivers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all drivers for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;

        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }

        const drivers = await prisma.driver.findMany({
            where: {
                organizationId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(drivers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific driver by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.json(driver);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new driver (superadmin)
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            email,
            licenseNumber,
            phoneNumber,
            status,
            experienceYears,
            rating,
            isActive,
            organizationId,
            baseSalary,
            hourlyRate,
            overtimeRate,
            bankAccountNumber,
            bankName
        } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Driver name is required and must be a string' });
        }
        if (!licenseNumber || typeof licenseNumber !== 'string') {
            return res.status(400).json({ message: 'License number is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }
        if (status && !['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const existingDriver = await prisma.driver.findFirst({
            where: {
                organizationId,
                OR: [
                    { licenseNumber: licenseNumber.trim() },
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ]
            }
        });

        if (existingDriver) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }

        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const driver = await prisma.driver.create({
            data: {
                name: name.trim(),
                email: email || null,
                licenseNumber: licenseNumber.trim(),
                phoneNumber: phoneNumber || null,
                status: status || 'ACTIVE',
                experienceYears: experienceYears ? parseInt(experienceYears.toString()) : null,
                rating: rating ? parseFloat(rating.toString()) : 0.0,
                isActive: isActive !== undefined ? isActive : true,
                organizationId,
                baseSalary: baseSalary || null,
                hourlyRate: hourlyRate || null,
                overtimeRate: overtimeRate !== undefined ? overtimeRate : 1.5,
                bankAccountNumber: bankAccountNumber || null,
                bankName: bankName || null
            },
            include: {
                organization: true
            }
        });

        res.status(201).json(driver);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a driver (superadmin)
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            licenseNumber,
            phoneNumber,
            status,
            experienceYears,
            rating,
            isActive,
            baseSalary,
            hourlyRate,
            overtimeRate,
            bankAccountNumber,
            bankName
        } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }

        if (status && !['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });

        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        if ((licenseNumber && licenseNumber !== existingDriver.licenseNumber) ||
            (email && email !== existingDriver.email) ||
            (phoneNumber && phoneNumber !== existingDriver.phoneNumber)) {
            const conflictingDriver = await prisma.driver.findFirst({
                where: {
                    OR: [
                        { licenseNumber: licenseNumber || undefined },
                        { email: email || undefined },
                        { phoneNumber: phoneNumber || undefined }
                    ],
                    id: { not: id },
                    organizationId: existingDriver.organizationId
                }
            });

            if (conflictingDriver) {
                return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
            }
        }

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) updateData.name = name.trim();
        if (email !== undefined) updateData.email = email;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber.trim();
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (status !== undefined) updateData.status = status;
        if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears.toString());
        if (rating !== undefined) updateData.rating = parseFloat(rating.toString());
        if (isActive !== undefined) updateData.isActive = isActive;
        if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
        if (overtimeRate !== undefined) updateData.overtimeRate = overtimeRate;
        if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
        if (bankName !== undefined) updateData.bankName = bankName;

        const driver = await prisma.driver.update({
            where: { id },
            data: updateData,
            include: {
                organization: true
            }
        });

        res.json(driver);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Soft delete a driver
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (existingDriver.deleted) {
            return res.status(400).json({ message: 'Driver is already deleted' });
        }
        const driver = await prisma.driver.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                isActive: false,
                status: 'INACTIVE'
            }
        });
        res.json({ message: 'Driver deleted successfully', driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/restore
 * @desc    Restore a soft-deleted driver
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/restore', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!existingDriver.deleted) {
            return res.status(400).json({ message: 'Driver is not deleted' });
        }
        const driver = await prisma.driver.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null,
                isActive: true,
                status: 'ACTIVE'
            },
            include: {
                organization: true
            }
        });
        res.json({ message: 'Driver restored successfully', driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/status
 * @desc    Update driver status
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/status', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        if (!status || !['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Valid status is required', validStatuses: ['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'] });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        const driver = await prisma.driver.update({
            where: { id },
            data: { status },
            include: {
                organization: true
            }
        });
        res.json({ message: 'Driver status updated successfully', driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all drivers
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const drivers = await prisma.driver.findMany({
            include: {
                organization: true,
                assignedVehicles: true
            }
        });
        const activeDrivers = drivers.filter(d => !d.deleted && d.isActive);
        const inactiveDrivers = drivers.filter(d => d.deleted || !d.isActive);
        const stats = {
            totalDrivers: drivers.length,
            activeDrivers: activeDrivers.length,
            inactiveDrivers: inactiveDrivers.length,
            driversByOrganization: activeDrivers.reduce((acc, d) => {
                const orgName = d.organization.name;
                if (!acc[orgName]) acc[orgName] = 0;
                acc[orgName] += 1;
                return acc;
            }, {} as Record<string, number>),
            driversWithVehicles: activeDrivers.filter(d => d.assignedVehicles.length > 0).length,
            topDrivers: activeDrivers
                .sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0))
                .slice(0, 5)
                .map(d => ({
                    id: d.id,
                    name: d.name,
                    organization: d.organization.name,
                    experienceYears: d.experienceYears,
                    vehicleCount: d.assignedVehicles.length
                }))
        };
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * User-specific routes
 */

/**
 * @route   GET /
 * @desc    Get all Drivers in a specific org
 * @access  Private (User)
 */

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        driver: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const drivers = await prisma.driver.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false
            },
            include: {
                assignedVehicles: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true,
                        name: true,
                        plateNumber: true,
                        status: true,
                        capacity: true
                    }
                }
            }
        })

        res.json(drivers.map(mapDriverResponse));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /unassigned
 * @desc    Get all unassigned drivers in a specific org
 * @access  Private (User)
 */
router.get('/unassigned', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    driver: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const drivers = await prisma.driver.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false,
                assignedVehicles: { none: {} }
            }
        });

        res.json(drivers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific Driver in a specific org by id
 * @access  Private (User)
 */

router.get('/:id', requireAuth, validateSchema(DriverIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        driver: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const driver = await prisma.driver.findUnique({
            where: {
                id,
                organizationId: activeOrgId, 
                deleted: false
            },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.json(mapDriverResponse(driver));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new driver
 * @access  Private (User)
 */


router.post('/', requireAuth, validateSchema(CreateDriverSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            email,
            licenseNumber,
            phoneNumber,
            status,
            experienceYears,
            rating,
            isActive,
            baseSalary,
            hourlyRate,
            overtimeRate,
            bankAccountNumber,
            bankName,
            vehicleId,
        } : CreateDriver = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        driver: ["create"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingDriver = await prisma.driver.findFirst({
            where: {
                organizationId: activeOrgId,
                OR: [
                    { licenseNumber },
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ].filter(c => c.email !== undefined || c.phoneNumber !== undefined || c.licenseNumber !== undefined)
            }
        });

        if (existingDriver) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }

        const driver = await prisma.$transaction(async (tx) => {
            const createdDriver = await tx.driver.create({
                data: {
                    name: name.trim(),
                    email: email || null,
                    licenseNumber: licenseNumber.trim(),
                    phoneNumber: phoneNumber || null,
                    status: status || 'ACTIVE',
                    experienceYears: experienceYears ? parseInt(experienceYears.toString()) : null,
                    rating: rating ? parseFloat(rating.toString()) : 0.0,
                    isActive: isActive !== undefined ? isActive : true,
                    organizationId: activeOrgId,
                    baseSalary: baseSalary || null,
                    hourlyRate: hourlyRate || null,
                    overtimeRate: overtimeRate !== undefined ? overtimeRate : 1.5,
                    bankAccountNumber: bankAccountNumber || null,
                    bankName: bankName || null
                },
                include: driverInclude,
            });

            await syncVehicleAssignment(tx, {
                driverId: createdDriver.id,
                organizationId: activeOrgId,
                vehicleId,
            });

            if (vehicleId === undefined) {
                return createdDriver;
            }

            const refreshedDriver = await tx.driver.findUnique({
                where: { id: createdDriver.id },
                include: driverInclude,
            });

            if (!refreshedDriver) {
                throw new HttpError(500, 'Driver record not found after creation');
            }

            return refreshedDriver;
        });

        // Send notification
        const notification = driverNotifications.created(activeOrgId, driver);
        await broadcastNotification(notification);

        res.json(mapDriverResponse(driver));

    } catch (err) {
        console.error(err);
        if (err instanceof HttpError) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        if (err instanceof Error && err.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   PUT /:id
 * @desc    Update a Driver
 * @access  Private (User)
 */

router.put('/:id',
    requireAuth,
    validateMultiple([{schema: DriverIdParam, target: 'params'}, {schema: UpdateDriverSchema, target: 'body'}]),
    async(req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const {
                name,
                email,
                licenseNumber,
                phoneNumber,
                status,
                experienceYears,
                rating,
                isActive,
                baseSalary,
                hourlyRate,
                overtimeRate,
                bankAccountNumber,
                bankName,
                vehicleId,
            } = req.body;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'Active organization not found' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                    body: {
                        permissions: {
                            driver: ["update"] 
                        }
                    }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const existingDriver = await prisma.driver.findFirst({
                where: {
                    id,
                    organizationId: activeOrgId,
                    deleted: false
                }
            });

            if (!existingDriver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            if ((licenseNumber && licenseNumber !== existingDriver.licenseNumber) ||
                (email && email !== existingDriver.email) ||
                (phoneNumber && phoneNumber !== existingDriver.phoneNumber)) {
                const conflictingDriver = await prisma.driver.findFirst({
                    where: {
                        OR: [
                            { licenseNumber: licenseNumber || undefined },
                            { email: email || undefined },
                            { phoneNumber: phoneNumber || undefined }
                        ],
                        id: { not: id },
                        organizationId: activeOrgId
                    }
                });
                if (conflictingDriver) {
                    return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
                }
            }

            const updateData: any = {};
            if (name !== undefined) updateData.name = name.trim();
            if (email !== undefined) updateData.email = email;
            if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber.trim();
            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
            if (status !== undefined) updateData.status = status;
            if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears.toString());
            if (rating !== undefined) updateData.rating = parseFloat(rating.toString());
            if (isActive !== undefined) updateData.isActive = isActive;
            if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
            if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
            if (overtimeRate !== undefined) updateData.overtimeRate = overtimeRate;
            if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
            if (bankName !== undefined) updateData.bankName = bankName;

            const driver = await prisma.$transaction(async (tx) => {
                const updatedDriver = await tx.driver.update({
                    where: { id },
                    data: updateData,
                    include: driverInclude,
                });

                await syncVehicleAssignment(tx, {
                    driverId: updatedDriver.id,
                    organizationId: activeOrgId,
                    vehicleId,
                });

                if (vehicleId === undefined) {
                    return updatedDriver;
                }

                const refreshedDriver = await tx.driver.findUnique({
                    where: { id },
                    include: driverInclude,
                });

                if (!refreshedDriver) {
                    throw new HttpError(500, 'Driver record not found after update');
                }

                return refreshedDriver;
            });

            // Send status change notification if status changed
            if (status !== undefined && status !== existingDriver.status) {
                const notifications = driverNotifications.statusChanged(activeOrgId, driver, status);
                for (const notif of notifications) {
                    await broadcastNotification(notif);
                }
            } else {
                // General update notification
                const notification = driverNotifications.updated(activeOrgId, driver);
                await broadcastNotification(notification);
            }

            res.json(mapDriverResponse(driver));
        } catch (err) {
            console.error(err);
            if (err instanceof HttpError) {
                return res.status(err.statusCode).json({ message: err.message });
            }
            if (err instanceof Error && err.message.includes('Unique constraint')) {
                return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
            }
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   DELETE /:id
 * @desc    Delete a driver
 * @access  Private (User)
 */


router.delete('/:id', requireAuth, validateSchema(DriverIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        driver: ["delete"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingDriver = await prisma.driver.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
                deleted: false
            }
        });

        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        await prisma.driver.update({
            where: {id, organizationId: activeOrgId},
            data: {
                deleted: true,
                deletedAt: new Date().toISOString(),
                isActive: false,
                status: 'INACTIVE'
            }
        })

        // Send notification
        const notification = driverNotifications.deleted(activeOrgId, existingDriver);
        await broadcastNotification(notification);

        res.status(204).send();

    } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /me/routes
 * @desc    Get routes assigned to the current driver
 * @access  Private (driver)
 */
router.get('/me/routes', requireAuth, async (req: Request, res: Response) => {
    try {
        const driverProfile = await findDriverProfileForRequest(req);

        if (!driverProfile) {
            return res.status(404).json({ message: 'Driver profile not found for current user' });
        }

        // Get filters from query params
        const { date, status, from, to, limit } = req.query;

        const legacyStatusMap: Record<string, DriverFacingStatus> = {
            PENDING: 'UPCOMING',
            IN_PROGRESS: 'ACTIVE',
        };

        const validStatusFilters = new Set<string>(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'INACTIVE']);

        let normalizedStatus: string | undefined;

        if (typeof status === 'string' && status.trim()) {
            const requested = status.trim().toUpperCase();
            normalizedStatus = legacyStatusMap[requested] ?? requested;

            if (!validStatusFilters.has(normalizedStatus)) {
                return res.status(400).json({ message: 'Invalid status filter' });
            }
        }

        const dateFilters: Prisma.DateTimeFilter = {};

        const normalizeDayBounds = (value: string, isEnd: boolean) => {
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                return null;
            }

            return isEnd
                ? new Date(parsed.setHours(23, 59, 59, 999))
                : new Date(parsed.setHours(0, 0, 0, 0));
        };

        if (date && typeof date === 'string') {
            const startOfDay = normalizeDayBounds(date, false);
            const endOfDay = normalizeDayBounds(date, true);

            if (startOfDay && endOfDay) {
                dateFilters.gte = startOfDay;
                dateFilters.lte = endOfDay;
            }
        }

        if (from && typeof from === 'string') {
            const fromDate = normalizeDayBounds(from, false);
            if (fromDate) {
                dateFilters.gte = fromDate;
            }
        }

        if (to && typeof to === 'string') {
            const toDate = normalizeDayBounds(to, true);
            if (toDate) {
                dateFilters.lte = toDate;
            }
        }

        const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : undefined;
        const today = startOfDay(new Date());

        let startDate = dateFilters.gte instanceof Date ? startOfDay(new Date(dateFilters.gte)) : today;
        if (Number.isNaN(startDate.getTime())) {
            startDate = today;
        }

        let endDate = dateFilters.lte instanceof Date ? endOfDay(new Date(dateFilters.lte)) : endOfDay(addDays(startDate, 60));
        if (Number.isNaN(endDate.getTime())) {
            endDate = endOfDay(addDays(startDate, 60));
        }

        if (endDate < startDate) {
            const aligned = startOfDay(endDate);
            startDate = aligned;
            endDate = endOfDay(aligned);
        }

        const scheduleRoutes = await buildDriverSchedule({
            driverProfile,
            startDate,
            endDate,
        });

        let filteredRoutes = scheduleRoutes;

        if (normalizedStatus === 'CANCELLED') {
            filteredRoutes = scheduleRoutes.filter((route) => route.driverStatus === 'CANCELLED');
        } else if (normalizedStatus === 'INACTIVE') {
            filteredRoutes = scheduleRoutes.filter((route) => route.managementStatus === 'INACTIVE');
        } else if (normalizedStatus) {
            filteredRoutes = scheduleRoutes.filter((route) => route.driverStatus === normalizedStatus);
        }

        if (parsedLimit && Number.isInteger(parsedLimit) && parsedLimit > 0) {
            filteredRoutes = filteredRoutes.slice(0, parsedLimit);
        }

        return res.json(filteredRoutes);
    } catch (error) {
        console.error('Error fetching driver routes:', error);
        res.status(500).json({ 
            message: 'Failed to fetch routes',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   GET /me/routes/:routeId
 * @desc    Get a specific route by ID (only if assigned to current driver)
 * @access  Private (driver)
 */
router.get('/me/routes/:routeId', requireAuth, async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        const driverProfile = await findDriverProfileForRequest(req);

        if (!driverProfile) {
            return res.status(404).json({ message: 'Driver profile not found for current user' });
        }

        const route = await prisma.route.findFirst({
            where: {
                id: routeId,
                organizationId: driverProfile.organizationId,
                deleted: false,
                vehicle: {
                    driverId: driverProfile.id
                }
            },
            include: Prisma.validator<Prisma.RouteInclude>()({
                location: {
                    select: {
                        id: true,
                        address: true,
                        type: true,
                        longitude: true,
                        latitude: true
                    }
                },
                source: {
                    select: {
                        id: true,
                        address: true,
                        type: true,
                        longitude: true,
                        latitude: true
                    }
                },
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        make: true,
                        model: true,
                        capacity: true,
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                stops: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            })
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const enrichedRoute = annotateRouteWithStatuses(route, new Date());

        res.json(enrichedRoute);
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ 
            message: 'Failed to fetch route',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   PATCH /me/routes/:routeId/status
 * @desc    Update route status (start, complete, etc.)
 * @access  Private (driver)
 */
router.patch('/me/routes/:routeId/status', requireAuth, async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        const { status } = req.body;
        const driverProfile = await findDriverProfileForRequest(req);

        if (!driverProfile) {
            return res.status(404).json({ message: 'Driver profile not found for current user' });
        }

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const requestedStatus = String(status).toUpperCase();
        const statusRemap: Partial<Record<string, RouteStatus>> = {
            IN_PROGRESS: 'ACTIVE',
            PENDING: 'ACTIVE',
        };

        const targetStatus = statusRemap[requestedStatus] ?? requestedStatus;
        const allowedTargetStatuses: RouteStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'INACTIVE'];

        if (!allowedTargetStatuses.includes(targetStatus as RouteStatus)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${allowedTargetStatuses.join(', ')}`
            });
        }

        const normalizedTargetStatus = targetStatus as RouteStatus;

        // Verify the route belongs to this driver
        const route = await prisma.route.findFirst({
            where: {
                id: routeId,
                organizationId: driverProfile.organizationId,
                deleted: false,
                vehicle: {
                    driverId: driverProfile.id
                }
            }
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Update the route status
        const updatedRoute = await prisma.route.update({
            where: { id: routeId },
            data: { status: normalizedTargetStatus },
            include: Prisma.validator<Prisma.RouteInclude>()({
                vehicleAvailability: {
                    include: {
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        make: true,
                        model: true,
                        capacity: true,
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                stops: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            })
        });

        const enrichedRoute = annotateRouteWithStatuses(updatedRoute, new Date());

        res.json(enrichedRoute);
    } catch (error) {
        console.error('Error updating route status:', error);
        res.status(500).json({ 
            message: 'Failed to update route status',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   POST /me/routes/:routeId/stops/:stopId/checkin
 * @desc    Mark a stop as completed/checked in
 * @access  Private (driver)
 */
router.post('/me/routes/:routeId/stops/:stopId/checkin', requireAuth, async (req: Request, res: Response) => {
    try {
        const { routeId, stopId } = req.params;
        const { pickedUp, timestamp, notes } = req.body;
        const driverProfile = await findDriverProfileForRequest(req);

        if (!driverProfile) {
            return res.status(404).json({ message: 'Driver profile not found for current user' });
        }

        // Verify the route belongs to this driver
        const route = await prisma.route.findFirst({
            where: {
                id: routeId,
                organizationId: driverProfile.organizationId,
                deleted: false,
                vehicle: {
                    driverId: driverProfile.id
                }
            },
            include: {
                stops: true
            }
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Verify the stop belongs to this route
        const stop = route.stops.find(s => s.id === stopId);
        if (!stop) {
            return res.status(404).json({ message: 'Stop not found on this route' });
        }

        // Update the stop as completed with timestamp and optional notes
        const updatedStop = await prisma.stop.update({
            where: { id: stopId },
            data: ( {
                completedAt: timestamp ? new Date(timestamp) : new Date(),
                notes: notes
            } as any ),
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json(updatedStop);
    } catch (error) {
        console.error('Error checking in stop:', error);
        res.status(500).json({ 
            message: 'Failed to check in stop',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   POST /me/location
 * @desc    Update driver location
 * @access  Private (driver)
 */
router.post('/me/location', requireAuth, async (req: Request, res: Response) => {
    try {
        const { latitude, longitude, accuracy, heading, speed } = req.body;
        const driverProfile = await findDriverProfileForRequest(req);

        if (!driverProfile) {
            return res.status(404).json({ message: 'Driver profile not found for current user' });
        }

        // For now, just acknowledge the location update
        // In the future, you might want to store this in a real-time location tracking table
        res.json({ 
            message: 'Location updated successfully',
            driverId: driverProfile.id,
            location: { latitude, longitude, accuracy, heading, speed },
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ 
            message: 'Failed to update location',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   GET /me/schedule
 * @desc    Get driver's weekly schedule
 * @access  Private (driver)
 */
router.get('/me/schedule', requireAuth, async (req: Request, res: Response) => {
    try {
        const driverProfile = await findDriverProfileForRequest(req);

        if (!driverProfile) {
            return res.status(404).json({ message: 'Driver profile not found for current user' });
        }

        const { from, to } = req.query;

        const today = startOfDay(new Date());
        let startDate = from ? startOfDay(new Date(from as string)) : today;
        if (Number.isNaN(startDate.getTime())) {
            startDate = today;
        }

        let endDate = to ? endOfDay(new Date(to as string)) : endOfDay(addDays(startDate, 60));
        if (Number.isNaN(endDate.getTime())) {
            endDate = endOfDay(addDays(startDate, 60));
        }

        if (endDate < startDate) {
            const swap = startDate;
            startDate = startOfDay(endDate);
            endDate = endOfDay(swap);
        }

        const scheduleRoutes = await buildDriverSchedule({
            driverProfile,
            startDate,
            endDate,
        });

        res.json(scheduleRoutes);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedule',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

export default router;

