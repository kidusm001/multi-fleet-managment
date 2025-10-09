import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { MonthlyPayrollJobData, OrganizationPayrollJobData } from './payroll.queue.js';
import { payrollQueue } from './payroll.queue.js';

const prisma = new PrismaClient();

export async function generateMonthlyPayroll(data: MonthlyPayrollJobData): Promise<void> {
  const { year, month } = data;

  console.log(`📅 Starting monthly payroll generation for ${year}-${month}`);

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  console.log(`📊 Found ${organizations.length} organizations`);

  for (const org of organizations) {
    await payrollQueue.add('organization-payroll-generation', {
      organizationId: org.id,
      year,
      month,
    });
    console.log(`✅ Queued payroll generation for organization: ${org.name}`);
  }
}

export async function generateOrganizationPayroll(data: OrganizationPayrollJobData): Promise<void> {
  const { organizationId, year, month } = data;

  console.log(`🏢 Generating payroll for organization: ${organizationId}, ${year}-${month}`);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const existingPeriod = await prisma.payrollPeriod.findFirst({
    where: {
      organizationId,
      startDate: start,
      endDate: end,
    },
  });

  if (existingPeriod) {
    console.log(`⚠️ Payroll period already exists for ${organizationId}: ${existingPeriod.id}`);
    return;
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const periodName = `${monthNames[month - 1]} ${year}`;

  const period = await prisma.payrollPeriod.create({
    data: {
      organization: { connect: { id: organizationId } },
      name: periodName,
      startDate: start,
      endDate: end,
      totalAmount: new Decimal(0),
      status: 'PENDING',
    },
  });

  console.log(`✅ Created payroll period: ${period.id}`);

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      organizationId,
      date: {
        gte: period.startDate,
        lte: period.endDate,
      },
    },
    include: {
      driver: true,
      vehicle: {
        include: {
          serviceProvider: true,
        },
      },
    },
  });

  if (attendanceRecords.length === 0) {
    console.log(`⚠️ No attendance records found for ${organizationId}`);
    return;
  }

  console.log(`📋 Found ${attendanceRecords.length} attendance records`);

  const driverMap = new Map<string, typeof attendanceRecords>();
  const serviceProviderMap = new Map<string, typeof attendanceRecords>();

  for (const record of attendanceRecords) {
    if (record.driverId && record.vehicle.type === 'IN_HOUSE') {
      const existing = driverMap.get(record.driverId) || [];
      existing.push(record);
      driverMap.set(record.driverId, existing);
    }

    if (record.vehicle.type === 'OUTSOURCED' && record.vehicle.serviceProviderId) {
      const spId = record.vehicle.serviceProviderId;
      const existing = serviceProviderMap.get(spId) || [];
      existing.push(record);
      serviceProviderMap.set(spId, existing);
    }
  }

  const entriesToCreate: Prisma.PayrollEntryCreateInput[] = [];

  for (const [driverId, records] of driverMap) {
    const driver = records[0].driver;
    if (!driver) continue;

    const summary = records.reduce(
      (acc, r) => {
        acc.daysWorked += 1;
        acc.hoursWorked += r.hoursWorked || 0;
        acc.tripsCompleted += r.tripsCompleted || 0;
        acc.kmsCovered += r.kmsCovered || 0;
        return acc;
      },
      { daysWorked: 0, hoursWorked: 0, tripsCompleted: 0, kmsCovered: 0 }
    );

    let basePay = new Decimal(0);
    let overtimePay = new Decimal(0);
    let bonuses = new Decimal(0);
    let deductions = new Decimal(0);

    if (driver.baseSalary) {
      basePay = new Decimal(driver.baseSalary);
    } else if (driver.hourlyRate) {
      const regularHours = Math.min(summary.hoursWorked, 160);
      basePay = new Decimal(driver.hourlyRate).mul(regularHours);
    }

    const regularHoursPerMonth = 160;
    if (summary.hoursWorked > regularHoursPerMonth && driver.hourlyRate) {
      const overtimeHours = summary.hoursWorked - regularHoursPerMonth;
      const overtimeRate = driver.overtimeRate || 1.5;
      overtimePay = new Decimal(driver.hourlyRate).mul(overtimeHours).mul(overtimeRate);
    }

    if (summary.tripsCompleted > 50) {
      bonuses = bonuses.add(new Decimal(summary.tripsCompleted - 50).mul(5));
    }

    const expectedWorkingDays = 22;
    const attendanceRate = (summary.daysWorked / expectedWorkingDays) * 100;
    if (attendanceRate >= 95) {
      bonuses = bonuses.add(100);
    }

    const avgKmPerHour = summary.hoursWorked > 0 ? summary.kmsCovered / summary.hoursWorked : 0;
    if (avgKmPerHour > 10) {
      bonuses = bonuses.add(50);
    }

    const grossPay = basePay.add(overtimePay).add(bonuses);

    deductions = deductions.add(grossPay.mul(0.1));

    const lateDays = records.filter((r) => r.hoursWorked && r.hoursWorked < 8).length;
    if (lateDays > 0) {
      deductions = deductions.add(new Decimal(lateDays).mul(20));
    }

    const netPay = grossPay.sub(deductions);

    entriesToCreate.push({
      payrollPeriod: { connect: { id: period.id } },
      organization: { connect: { id: organizationId } },
      driver: { connect: { id: driverId } },
      vehicle: { connect: { id: records[0].vehicleId } },
      payrollType: 'SALARY',
      description: `Salary for ${summary.daysWorked} days (${summary.hoursWorked.toFixed(1)}h, ${summary.tripsCompleted} trips)`,
      amount: basePay.add(overtimePay),
      bonuses: bonuses,
      deductions: deductions,
      netPay: netPay,
      daysWorked: summary.daysWorked,
      hoursWorked: summary.hoursWorked,
      tripsCompleted: summary.tripsCompleted,
      kmsCovered: summary.kmsCovered,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PENDING',
    });
  }

  for (const [serviceProviderId, records] of serviceProviderMap) {
    const serviceProvider = records[0].vehicle.serviceProvider;
    if (!serviceProvider) continue;

    const summary = records.reduce(
      (acc, r) => {
        acc.daysWorked += 1;
        acc.tripsCompleted += r.tripsCompleted || 0;
        acc.kmsCovered += r.kmsCovered || 0;
        acc.fuelCost += parseFloat(r.fuelCost?.toString() || '0');
        acc.tollCost += parseFloat(r.tollCost?.toString() || '0');
        return acc;
      },
      { daysWorked: 0, tripsCompleted: 0, kmsCovered: 0, fuelCost: 0, tollCost: 0 }
    );

    let amount = new Decimal(0);
    let bonuses = new Decimal(0);
    let deductions = new Decimal(0);

    if (serviceProvider.monthlyRate) {
      amount = new Decimal(serviceProvider.monthlyRate);
    }

    if (serviceProvider.perKmRate) {
      if (amount.eq(0)) {
        amount = new Decimal(serviceProvider.perKmRate).mul(summary.kmsCovered);
      } else {
        bonuses = bonuses.add(new Decimal(serviceProvider.perKmRate).mul(summary.kmsCovered));
      }
    }

    if (serviceProvider.perTripRate) {
      if (amount.eq(0)) {
        amount = new Decimal(serviceProvider.perTripRate).mul(summary.tripsCompleted);
      } else {
        bonuses = bonuses.add(new Decimal(serviceProvider.perTripRate).mul(summary.tripsCompleted));
      }
    }

    if (amount.eq(0) && records[0].vehicle.dailyRate) {
      amount = new Decimal(records[0].vehicle.dailyRate).mul(summary.daysWorked);
    }

    const expenses = new Decimal(summary.fuelCost + summary.tollCost);
    amount = amount.add(expenses);

    if (summary.tripsCompleted > 200) {
      bonuses = bonuses.add(500);
    }

    const grossPay = amount.add(bonuses);

    deductions = deductions.add(grossPay.mul(0.02));

    const providerVehicles = await prisma.vehicle.findMany({
      where: { serviceProviderId },
      select: { id: true },
    });

    const avgTripsPerVehicle =
      providerVehicles.length > 0 ? summary.tripsCompleted / providerVehicles.length : 0;

    if (avgTripsPerVehicle < 20 && avgTripsPerVehicle > 0) {
      deductions = deductions.add(500);
    }

    const netPay = grossPay.sub(deductions);

    entriesToCreate.push({
      payrollPeriod: { connect: { id: period.id } },
      organization: { connect: { id: organizationId } },
      serviceProvider: { connect: { id: serviceProviderId } },
      vehicle: { connect: { id: records[0].vehicleId } },
      payrollType: 'SERVICE_FEE',
      description: `Service fee for ${summary.daysWorked} days (${summary.tripsCompleted} trips, ${summary.kmsCovered.toFixed(1)}km) + expenses`,
      amount: amount,
      bonuses: bonuses,
      deductions: deductions,
      netPay: netPay,
      daysWorked: summary.daysWorked,
      hoursWorked: null,
      tripsCompleted: summary.tripsCompleted,
      kmsCovered: summary.kmsCovered,
      paymentMethod: 'BANK_TRANSFER',
      status: 'PENDING',
    });
  }

  console.log(`💰 Creating ${entriesToCreate.length} payroll entries`);

  const createdEntries = await prisma.$transaction(async (tx) => {
    const entries = await Promise.all(
      entriesToCreate.map((data) => tx.payrollEntry.create({ data }))
    );

    const totalAmount = entries.reduce((sum, entry) => sum.add(entry.netPay), new Decimal(0));

    await tx.payrollPeriod.update({
      where: { id: period.id },
      data: { totalAmount },
    });

    return entries;
  });

  console.log(`✅ Generated ${createdEntries.length} payroll entries for ${organizationId}`);
}
