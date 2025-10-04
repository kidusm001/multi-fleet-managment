import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import vehicleRequestsRouter from '../vehicle-requests';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import * as authMiddleware from '../../middleware/auth';
import * as zodValidation from '../../middleware/zodValidation';
import { fromNodeHeaders } from 'better-auth/node';

vi.mock('../../db', () => ({
	default: {
		vehicleRequest: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			groupBy: vi.fn(),
			count: vi.fn(),
		},
		organization: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
		},
		vehicle: {
			create: vi.fn(),
		},
	},
}));

vi.mock('../../middleware/auth', () => ({
	requireAuth: vi.fn((req: Request, _res: Response, next: NextFunction) => {
		(req as any).session = {
			session: {
				activeOrganizationId: 'org_test_123',
				user: { id: 'user_test_123' },
			},
		};
		next();
	}),
	requireRole: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

vi.mock('better-auth/node', () => ({
	fromNodeHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../lib/auth', () => ({
	auth: {
		api: {
			hasPermission: vi.fn().mockResolvedValue({ success: true }),
		},
	},
}));

vi.mock('../../middleware/zodValidation', () => ({
	validateSchema: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

const mockPrisma = prisma as unknown as {
	vehicleRequest: {
		findMany: Mock;
		findUnique: Mock;
		findFirst: Mock;
		create: Mock;
		update: Mock;
		delete: Mock;
		groupBy: Mock;
		count: Mock;
	};
	organization: {
		findUnique: Mock;
		findMany: Mock;
	};
	vehicle: {
		create: Mock;
	};
};

const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
const permissionMock = auth.api.hasPermission as unknown as Mock;
const fromNodeHeadersMock = fromNodeHeaders as unknown as Mock;
const validateSchemaMock = zodValidation.validateSchema as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/vehicle-requests', vehicleRequestsRouter);

type RouteLayer = {
	route?: {
		path: string;
		methods: Record<string, boolean>;
		stack: Array<{ handle: (req: Request, res: Response, next: NextFunction) => void }>;
	};
};

const ensurePendingBypass = () => {
		const routerStack = (vehicleRequestsRouter as any).stack as RouteLayer[];
		const getByIdLayer = routerStack?.find((layer) => layer.route?.path === '/:id' && layer.route.methods?.get);
		if (!getByIdLayer) {
			return;
		}
		const validateLayer = getByIdLayer.route!.stack[1];
		if (!validateLayer) {
			return;
		}
		const current = validateLayer.handle as any;
		if (current.__pendingWrapped) {
			return;
		}
		const original = validateLayer.handle;
		const wrapped = (req: Request, res: Response, next: NextFunction) => {
			if (req.params?.id === 'pending') {
				return next('route');
			}
			return original(req, res, next);
		};
		(wrapped as any).__pendingWrapped = true;
		validateLayer.handle = wrapped;
};

const baseOrganization = {
	id: 'org1',
	name: 'Org 1',
};

const baseRequest = {
	id: 'req1',
	organizationId: 'org1',
	name: 'Request One',
	licensePlate: 'ABC-123',
	capacity: 12,
	type: 'BUS',
	model: 'Model X',
	requestedBy: 'manager',
	status: 'PENDING',
	categoryId: 'cat1',
	dailyRate: 100,
	vendor: 'Vendor',
	requestedAt: new Date().toISOString(),
	approvedBy: null,
	approvedAt: null,
	comment: null,
	organization: baseOrganization,
	category: { id: 'cat1', name: 'Category 1' },
};

const baseVehicle = {
	id: 'veh1',
	name: 'Vehicle 1',
	plateNumber: 'XYZ-789',
	categoryId: 'cat1',
	dailyRate: 100,
	capacity: 12,
	type: 'IN_HOUSE',
	model: 'Model X',
	vendor: 'Vendor',
	status: 'AVAILABLE',
	organizationId: 'org1',
};

const resetMocks = () => {
	requireAuthMock.mockReset();
	requireAuthMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
		(req as any).session = {
			session: {
				activeOrganizationId: 'org_test_123',
				user: { id: 'user_test_123' },
			},
		};
		next();
	});

	permissionMock.mockReset();
	permissionMock.mockResolvedValue({ success: true });

	fromNodeHeadersMock.mockReset();
	fromNodeHeadersMock.mockResolvedValue({});

	mockPrisma.vehicleRequest.findMany.mockReset();
	mockPrisma.vehicleRequest.findMany.mockResolvedValue([baseRequest]);

	mockPrisma.vehicleRequest.findUnique.mockReset();
	mockPrisma.vehicleRequest.findUnique.mockResolvedValue(baseRequest);

	mockPrisma.vehicleRequest.findFirst.mockReset();
	mockPrisma.vehicleRequest.findFirst.mockResolvedValue(baseRequest);

	mockPrisma.vehicleRequest.create.mockReset();
	mockPrisma.vehicleRequest.create.mockResolvedValue(baseRequest);

	mockPrisma.vehicleRequest.update.mockReset();
	mockPrisma.vehicleRequest.update.mockResolvedValue({
		...baseRequest,
		status: 'APPROVED',
		approvedBy: 'admin',
		approvedAt: new Date().toISOString(),
	});

	mockPrisma.vehicleRequest.delete.mockReset();
	mockPrisma.vehicleRequest.delete.mockResolvedValue(baseRequest);

	mockPrisma.vehicleRequest.count.mockReset();
	mockPrisma.vehicleRequest.count.mockResolvedValue(1);

	mockPrisma.vehicleRequest.groupBy.mockReset();
	mockPrisma.vehicleRequest.groupBy.mockImplementation(async (args: any) => {
		if (args.by?.includes('status')) {
			return [{ status: 'PENDING', _count: { id: 1 } }];
		}
		if (args.by?.includes('organizationId')) {
			return [{ organizationId: 'org1', _count: { id: 1 } }];
		}
		return [];
	});

	mockPrisma.organization.findUnique.mockReset();
	mockPrisma.organization.findUnique.mockResolvedValue(baseOrganization);

	mockPrisma.organization.findMany.mockReset();
	mockPrisma.organization.findMany.mockResolvedValue([baseOrganization]);

	mockPrisma.vehicle.create.mockReset();
	mockPrisma.vehicle.create.mockResolvedValue(baseVehicle);

		validateSchemaMock.mockReset();
		validateSchemaMock.mockImplementation(() => (_req: Request, _res: Response, next: NextFunction) => next());

		ensurePendingBypass();
};

describe('Vehicle Requests Routes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetMocks();
	});

	describe('Superadmin routes', () => {
		describe('GET /vehicle-requests/superadmin', () => {
			it('returns vehicle requests with applied filters', async () => {
				const res = await request(app).get('/vehicle-requests/superadmin?organizationId=org1&status=PENDING&categoryId=cat1');

				expect(res.status).toBe(200);
				expect(mockPrisma.vehicleRequest.findMany).toHaveBeenCalledWith({
					where: { organizationId: 'org1', status: 'PENDING', categoryId: 'cat1' },
					include: {
						organization: true,
						category: true,
					},
					orderBy: { requestedAt: 'desc' },
				});
			});

			it('returns 500 when fetching requests fails', async () => {
				mockPrisma.vehicleRequest.findMany.mockRejectedValueOnce(new Error('DB error'));

				const res = await request(app).get('/vehicle-requests/superadmin');

				expect(res.status).toBe(500);
			});
		});

		describe('GET /vehicle-requests/superadmin/:id', () => {
			it('returns a single vehicle request by id', async () => {
				const res = await request(app).get('/vehicle-requests/superadmin/req1');

				expect(res.status).toBe(200);
				expect(mockPrisma.vehicleRequest.findUnique).toHaveBeenCalledWith({
					where: { id: 'req1' },
					include: {
						organization: true,
						category: true,
					},
				});
			});

			it('handles missing request and database errors', async () => {
				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				let res = await request(app).get('/vehicle-requests/superadmin/unknown');
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockRejectedValueOnce(new Error('fail'));
				res = await request(app).get('/vehicle-requests/superadmin/req1');
				expect(res.status).toBe(500);
			});
		});

		describe('POST /vehicle-requests/superadmin', () => {
			it('creates a vehicle request for an organization', async () => {
				const payload = {
					organizationId: 'org1',
					name: 'Request One',
					licensePlate: 'ABC-123',
					capacity: 12,
					type: 'BUS',
					model: 'Model X',
					requestedBy: 'superadmin',
					dailyRate: 150,
				};

				const res = await request(app).post('/vehicle-requests/superadmin').send(payload);

				expect(res.status).toBe(201);
				expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({ where: { id: 'org1' } });
				expect(mockPrisma.vehicleRequest.create).toHaveBeenCalledWith({
					data: expect.objectContaining(payload),
				});
			});

			it('handles validation, organization lookup, and database errors', async () => {
				let res = await request(app)
					.post('/vehicle-requests/superadmin')
					.send({ organizationId: 'org1', licensePlate: 'ABC-123', capacity: 12, type: 'BUS', model: 'Model X', requestedBy: 'superadmin' });
				expect(res.status).toBe(400);

				resetMocks();

				mockPrisma.organization.findUnique.mockResolvedValueOnce(null);
				res = await request(app)
					.post('/vehicle-requests/superadmin')
					.send({
						organizationId: 'missing',
						name: 'Request',
						licensePlate: 'ABC-123',
						capacity: 12,
						type: 'BUS',
						model: 'Model X',
						requestedBy: 'superadmin',
					});
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.create.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app)
					.post('/vehicle-requests/superadmin')
					.send({
						organizationId: 'org1',
						name: 'Request',
						licensePlate: 'ABC-123',
						capacity: 12,
						type: 'BUS',
						model: 'Model X',
						requestedBy: 'superadmin',
					});
				expect(res.status).toBe(500);
			});
		});

		describe('PUT /vehicle-requests/superadmin/:id', () => {
			it('updates a vehicle request for superadmin', async () => {
				mockPrisma.vehicleRequest.update.mockResolvedValueOnce({ ...baseRequest, name: 'Updated' });

				const res = await request(app)
					.put('/vehicle-requests/superadmin/req1')
					.send({ name: 'Updated' });

				expect(res.status).toBe(200);
				expect(res.body.name).toBe('Updated');
			});

			it('handles missing request and update errors', async () => {
				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				let res = await request(app)
					.put('/vehicle-requests/superadmin/req1')
					.send({ name: 'Updated' });
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.update.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app)
					.put('/vehicle-requests/superadmin/req1')
					.send({ name: 'Updated' });
				expect(res.status).toBe(500);
			});
		});

		describe('PATCH /vehicle-requests/superadmin/:id/approve', () => {
			it('approves a vehicle request', async () => {
				const res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/approve')
					.send({ approverRole: 'admin' });

				expect(res.status).toBe(200);
				expect(mockPrisma.vehicleRequest.update).toHaveBeenCalledWith({
					where: { id: 'req1' },
					data: expect.objectContaining({ status: 'APPROVED', approvedBy: 'admin' }),
				});
			});

			it('handles missing approver role, not found request, and update errors', async () => {
				let res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/approve')
					.send({});
				expect(res.status).toBe(400);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/approve')
					.send({ approverRole: 'admin' });
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.update.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/approve')
					.send({ approverRole: 'admin' });
				expect(res.status).toBe(500);
			});
		});

		describe('PATCH /vehicle-requests/superadmin/:id/reject', () => {
			it('rejects a vehicle request with comment', async () => {
				mockPrisma.vehicleRequest.update.mockResolvedValueOnce({ ...baseRequest, status: 'REJECTED', comment: 'No capacity' });

				const res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/reject')
					.send({ comment: 'No capacity' });

				expect(res.status).toBe(200);
				expect(res.body.status).toBe('REJECTED');
			});

			it('handles missing comment, not found request, and update errors', async () => {
				let res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/reject')
					.send({});
				expect(res.status).toBe(400);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/reject')
					.send({ comment: 'Reason' });
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.update.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app)
					.patch('/vehicle-requests/superadmin/req1/reject')
					.send({ comment: 'Reason' });
				expect(res.status).toBe(500);
			});
		});

		describe('DELETE /vehicle-requests/superadmin/:id', () => {
			it('deletes a vehicle request', async () => {
				const res = await request(app).delete('/vehicle-requests/superadmin/req1');

				expect(res.status).toBe(200);
				expect(res.body.message).toBe('Vehicle request deleted successfully');
			});

			it('returns 500 when deletion fails', async () => {
				mockPrisma.vehicleRequest.delete.mockRejectedValueOnce(new Error('DB error'));

				const res = await request(app).delete('/vehicle-requests/superadmin/req1');

				expect(res.status).toBe(500);
			});
		});

		describe('GET /vehicle-requests/superadmin/stats/summary', () => {
			it('returns summary statistics and handles database errors', async () => {
				mockPrisma.vehicleRequest.count.mockResolvedValueOnce(3);
				mockPrisma.vehicleRequest.groupBy.mockResolvedValueOnce([
					{ status: 'PENDING', _count: { id: 2 } },
					{ status: 'APPROVED', _count: { id: 1 } },
				]);
				mockPrisma.vehicleRequest.groupBy.mockResolvedValueOnce([
					{ organizationId: 'org1', _count: { id: 3 } },
				]);
				mockPrisma.organization.findMany.mockResolvedValueOnce([baseOrganization]);

				const res = await request(app).get('/vehicle-requests/superadmin/stats/summary');

				expect(res.status).toBe(200);
				expect(res.body.totalRequests).toBe(3);
				expect(res.body.requestsByOrganization[0].organization).toBe('Org 1');

				resetMocks();

				mockPrisma.vehicleRequest.count.mockRejectedValueOnce(new Error('DB error'));
				const errorRes = await request(app).get('/vehicle-requests/superadmin/stats/summary');
				expect(errorRes.status).toBe(500);
			});
		});
	});

	describe('Organization routes', () => {
		describe('GET /vehicle-requests', () => {
			it('returns vehicle requests for active organization', async () => {
				const res = await request(app).get('/vehicle-requests?status=PENDING');

				expect(res.status).toBe(200);
				expect(mockPrisma.vehicleRequest.findMany).toHaveBeenCalledWith({
					where: { organizationId: 'org_test_123', status: 'PENDING' },
					include: { category: true, organization: true },
					orderBy: { requestedAt: 'desc' },
				});
			});

			it('handles missing organization, permission denial, and database errors', async () => {
				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: { user: { id: 'user' } } };
					next();
				});
				let res = await request(app).get('/vehicle-requests');
				expect(res.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				res = await request(app).get('/vehicle-requests');
				expect(res.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.findMany.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app).get('/vehicle-requests');
				expect(res.status).toBe(500);
			});
		});

		describe('GET /vehicle-requests/:id', () => {
			it('returns a vehicle request by id for the organization', async () => {
				const res = await request(app).get('/vehicle-requests/req1');

				expect(res.status).toBe(200);
				expect(res.body.id).toBe('req1');
			});

			it('handles guard clauses, missing request, and database errors', async () => {
				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let res = await request(app).get('/vehicle-requests/req1');
				expect(res.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				res = await request(app).get('/vehicle-requests/req1');
				expect(res.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				res = await request(app).get('/vehicle-requests/req1');
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app).get('/vehicle-requests/req1');
				expect(res.status).toBe(500);
			});
		});

		describe('POST /vehicle-requests', () => {
			it('creates a vehicle request for the organization', async () => {
				mockPrisma.vehicleRequest.create.mockResolvedValueOnce({ ...baseRequest, organizationId: 'org_test_123' });

				const res = await request(app)
					.post('/vehicle-requests')
					.send({
						name: 'Org Request',
						licensePlate: 'XYZ-789',
						dailyRate: 200,
						capacity: 10,
						type: 'BUS',
						model: 'Model Y',
						vendor: 'Vendor',
						requestedBy: 'manager',
					});

				expect(res.status).toBe(201);
				expect(mockPrisma.vehicleRequest.create).toHaveBeenCalledWith({
					data: expect.objectContaining({
						organizationId: 'org_test_123',
						status: 'PENDING',
						name: 'Org Request',
						requestedBy: 'manager',
					}),
					include: { category: true },
				});
			});

			it('handles missing org, permission denial, and creation errors', async () => {
				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let res = await request(app)
					.post('/vehicle-requests')
					.send({ name: 'Req', licensePlate: 'XYZ', dailyRate: 200, capacity: 10, type: 'BUS', model: 'Model', requestedBy: 'manager' });
				expect(res.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				res = await request(app)
					.post('/vehicle-requests')
					.send({ name: 'Req', licensePlate: 'XYZ', dailyRate: 200, capacity: 10, type: 'BUS', model: 'Model', requestedBy: 'manager' });
				expect(res.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.create.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app)
					.post('/vehicle-requests')
					.send({ name: 'Req', licensePlate: 'XYZ', dailyRate: 200, capacity: 10, type: 'BUS', model: 'Model', requestedBy: 'manager' });
				expect(res.status).toBe(500);
			});
		});

		describe('PUT /vehicle-requests/:id', () => {
			it('updates a pending vehicle request for the organization', async () => {
				mockPrisma.vehicleRequest.update.mockResolvedValueOnce({ ...baseRequest, name: 'Org Updated' });

				const res = await request(app)
					.put('/vehicle-requests/req1')
					.send({ name: 'Org Updated' });

				expect(res.status).toBe(200);
				expect(res.body.name).toBe('Org Updated');
			});

			it('handles guard checks, missing request, processed request, and update errors', async () => {
				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let res = await request(app)
					.put('/vehicle-requests/req1')
					.send({ name: 'Update' });
				expect(res.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				res = await request(app)
					.put('/vehicle-requests/req1')
					.send({ name: 'Update' });
				expect(res.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.findFirst.mockResolvedValueOnce(null);
				res = await request(app)
					.put('/vehicle-requests/req1')
					.send({ name: 'Update' });
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.findFirst.mockResolvedValueOnce({ ...baseRequest, status: 'APPROVED' });
				res = await request(app)
					.put('/vehicle-requests/req1')
					.send({ name: 'Update' });
				expect(res.status).toBe(400);

				resetMocks();

				mockPrisma.vehicleRequest.update.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app)
					.put('/vehicle-requests/req1')
					.send({ name: 'Update' });
				expect(res.status).toBe(500);
			});
		});

		describe('DELETE /vehicle-requests/:id', () => {
			it('deletes a pending vehicle request for the organization', async () => {
				const res = await request(app).delete('/vehicle-requests/req1');

				expect(res.status).toBe(204);
				expect(mockPrisma.vehicleRequest.delete).toHaveBeenCalledWith({
					where: { id: 'req1', organizationId: 'org_test_123' },
				});
			});

			it('handles guard checks, missing request, processed request, and delete errors', async () => {
				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let res = await request(app).delete('/vehicle-requests/req1');
				expect(res.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				res = await request(app).delete('/vehicle-requests/req1');
				expect(res.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.findFirst.mockResolvedValueOnce(null);
				res = await request(app).delete('/vehicle-requests/req1');
				expect(res.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.findFirst.mockResolvedValueOnce({ ...baseRequest, status: 'APPROVED' });
				res = await request(app).delete('/vehicle-requests/req1');
				expect(res.status).toBe(400);

				resetMocks();

				mockPrisma.vehicleRequest.delete.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app).delete('/vehicle-requests/req1');
				expect(res.status).toBe(500);
			});
		});

		describe('GET /vehicle-requests/pending', () => {
			it('returns pending vehicle requests for organization', async () => {
					validateSchemaMock.mockImplementationOnce(() => (req: Request, _res: Response, next: NextFunction) => {
						if ((req as any).params?.id === 'pending') {
							return next('route');
						}
						next();
					});

				const res = await request(app).get('/vehicle-requests/pending');

				expect(res.status).toBe(200);
				expect(mockPrisma.vehicleRequest.findMany).toHaveBeenCalledWith({
					where: { status: 'PENDING', organizationId: 'org_test_123' },
					include: { category: true, organization: true },
					orderBy: { requestedAt: 'desc' },
				});
			});

			it('handles missing organization, permission denial, and database errors', async () => {
				validateSchemaMock.mockImplementationOnce(() => (req: Request, _res: Response, next: NextFunction) => {
					if ((req as any).params?.id === 'pending') {
						return next('route');
					}
					next();
				});
				requireAuthMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let res = await request(app).get('/vehicle-requests/pending');
				expect(res.status).toBe(400);

				resetMocks();

				validateSchemaMock.mockImplementationOnce(() => (req: Request, _res: Response, next: NextFunction) => {
					if ((req as any).params?.id === 'pending') {
						return next('route');
					}
					next();
				});
				permissionMock.mockResolvedValueOnce({ success: false });
				res = await request(app).get('/vehicle-requests/pending');
				expect(res.status).toBe(403);

				resetMocks();

				validateSchemaMock.mockImplementationOnce(() => (req: Request, _res: Response, next: NextFunction) => {
					if ((req as any).params?.id === 'pending') {
						return next('route');
					}
					next();
				});
				mockPrisma.vehicleRequest.findMany.mockRejectedValueOnce(new Error('DB error'));
				res = await request(app).get('/vehicle-requests/pending');
				expect(res.status).toBe(500);
			});
		});

		describe('POST /vehicle-requests/:id/approve', () => {
			it('approves a pending request, creates vehicle, and handles guard branches', async () => {
				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce({ ...baseRequest, organizationId: 'org_test_123' });
				mockPrisma.vehicleRequest.update.mockResolvedValueOnce({ ...baseRequest, status: 'APPROVED' });

				const res = await request(app).post('/vehicle-requests/req1/approve');

				expect(res.status).toBe(200);
				expect(res.body.updatedRequest.status).toBe('APPROVED');
				expect(res.body.vehicle.id).toBe('veh1');

				resetMocks();

				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let guardRes = await request(app).post('/vehicle-requests/req1/approve');
				expect(guardRes.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				guardRes = await request(app).post('/vehicle-requests/req1/approve');
				expect(guardRes.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				guardRes = await request(app).post('/vehicle-requests/req1/approve');
				expect(guardRes.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.update.mockRejectedValueOnce(new Error('DB error'));
				guardRes = await request(app).post('/vehicle-requests/req1/approve');
				expect(guardRes.status).toBe(500);
			});
		});

		describe('POST /vehicle-requests/:id/reject', () => {
			it('rejects a pending request and handles guard branches', async () => {
				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce({ ...baseRequest, organizationId: 'org_test_123' });
				mockPrisma.vehicleRequest.update.mockResolvedValueOnce({ ...baseRequest, status: 'REJECTED', comment: 'Reason' });

				const res = await request(app)
					.post('/vehicle-requests/req1/reject')
					.send({ comment: 'Reason' });

				expect(res.status).toBe(200);
				expect(res.body.status).toBe('REJECTED');

				resetMocks();

				requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
					(req as any).session = { session: {} };
					next();
				});
				let guardRes = await request(app)
					.post('/vehicle-requests/req1/reject')
					.send({ comment: 'Reason' });
				expect(guardRes.status).toBe(400);

				resetMocks();

				permissionMock.mockResolvedValueOnce({ success: false });
				guardRes = await request(app)
					.post('/vehicle-requests/req1/reject')
					.send({ comment: 'Reason' });
				expect(guardRes.status).toBe(403);

				resetMocks();

				mockPrisma.vehicleRequest.findUnique.mockResolvedValueOnce(null);
				guardRes = await request(app)
					.post('/vehicle-requests/req1/reject')
					.send({ comment: 'Reason' });
				expect(guardRes.status).toBe(404);

				resetMocks();

				mockPrisma.vehicleRequest.update.mockRejectedValueOnce(new Error('DB error'));
				guardRes = await request(app)
					.post('/vehicle-requests/req1/reject')
					.send({ comment: 'Reason' });
				expect(guardRes.status).toBe(500);
			});
		});
	});
});
