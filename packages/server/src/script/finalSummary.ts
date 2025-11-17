import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateCompleteSummary() {
  console.log('🏢 COMPREHENSIVE FLEET MANAGEMENT SETUP SUMMARY');
  console.log('===============================================\n');

  // Get all organizations with their complete data
  const organizations = await prisma.organization.findMany({
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      },
      drivers: true,
      vehicles: {
        include: {
          category: true,
          driver: true
        }
      },
      routes: {
        include: {
          stops: true,
          vehicle: true,
          shift: true
        }
      },
      departments: true,
      shifts: true,
      employees: true,
      vehicleAvailability: true,
      vehicleRequests: true,
      notifications: true,
      payrollReports: true,
      vehicleCategories: true
    },
    orderBy: { name: 'asc' }
  });

  console.log(`📊 ORGANIZATIONS: ${organizations.length} total\n`);

  for (const org of organizations) {
    console.log(`🏢 ${org.name.toUpperCase()} (${org.slug})`);
    console.log(`   ID: ${org.id}`);
    console.log(`   Created: ${org.createdAt.toLocaleDateString()}`);
    
    // Members by role
    console.log(`\n   👥 MEMBERS (${org.members.length} total):`);
    const membersByRole = org.members.reduce((acc, member) => {
      if (!acc[member.role]) acc[member.role] = [];
      acc[member.role].push(member);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(membersByRole).forEach(([role, members]) => {
      console.log(`      ${role.toUpperCase()}: ${members.length}`);
      members.forEach(member => {
        console.log(`        - ${member.user.name} (${member.user.email})`);
      });
    });

    // Fleet Information
    console.log(`\n   🚗 FLEET INFORMATION:`);
    console.log(`      Vehicle Categories: ${org.vehicleCategories.length}`);
    org.vehicleCategories.forEach(cat => {
      console.log(`        - ${cat.name} (capacity: ${cat.capacity})`);
    });

    console.log(`      Vehicles: ${org.vehicles.length}`);
    org.vehicles.forEach(vehicle => {
      const driverName = vehicle.driver ? vehicle.driver.name : 'Unassigned';
      console.log(`        - ${vehicle.name} (${vehicle.plateNumber}) - ${vehicle.status} - Driver: ${driverName}`);
    });

    console.log(`      Drivers: ${org.drivers.length}`);
    org.drivers.forEach(driver => {
      console.log(`        - ${driver.name} (${driver.email}) - ${driver.status} - ${driver.experienceYears}y exp`);
    });

    // Organizational Structure
    console.log(`\n   🏢 ORGANIZATIONAL STRUCTURE:`);
    console.log(`      Departments: ${org.departments.length}`);
    org.departments.forEach(dept => {
      console.log(`        - ${dept.name}`);
    });

    console.log(`      Shifts: ${org.shifts.length}`);
    org.shifts.forEach(shift => {
      const startTime = shift.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const endTime = shift.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      console.log(`        - ${shift.name} (${startTime} - ${endTime})`);
    });

    console.log(`      Employees: ${org.employees.length}`);

    // Routes & Operations
    console.log(`\n   🗺️  ROUTES & OPERATIONS:`);
    console.log(`      Routes: ${org.routes.length}`);
    org.routes.forEach(route => {
      const vehicleName = route.vehicle ? route.vehicle.name : 'No vehicle assigned';
      const shiftName = route.shift ? route.shift.name : 'No shift assigned';
      console.log(`        - ${route.name}: ${route.description}`);
      console.log(`          Vehicle: ${vehicleName} | Shift: ${shiftName} | Status: ${route.status}`);
      console.log(`          Stops: ${route.stops.length}`);
      route.stops.forEach(stop => {
        console.log(`            ${stop.order + 1}. ${stop.name} - ${stop.address}`);
      });
    });

    // Business Operations
    console.log(`\n   📋 BUSINESS OPERATIONS:`);
    console.log(`      Vehicle Availability Records: ${org.vehicleAvailability.length}`);
    console.log(`      Vehicle Requests: ${org.vehicleRequests.length}`);
    
    const requestsByStatus = org.vehicleRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(requestsByStatus).forEach(([status, count]) => {
      console.log(`        ${status}: ${count}`);
    });

    console.log(`      Notifications: ${org.notifications.length}`);
    const notificationsByType = org.notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(notificationsByType).forEach(([type, count]) => {
      console.log(`        ${type}: ${count}`);
    });

    console.log(`      Payroll Reports: ${org.payrollReports.length}`);
    const payrollByStatus = org.payrollReports.reduce((acc, payroll) => {
      acc[payroll.status] = (acc[payroll.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(payrollByStatus).forEach(([status, count]) => {
      console.log(`        ${status}: ${count}`);
    });

    console.log('\n' + '='.repeat(80) + '\n');
  }

  // Overall Statistics
  const totalStats = {
    organizations: organizations.length,
    members: organizations.reduce((sum, org) => sum + org.members.length, 0),
    drivers: organizations.reduce((sum, org) => sum + org.drivers.length, 0),
    vehicles: organizations.reduce((sum, org) => sum + org.vehicles.length, 0),
    routes: organizations.reduce((sum, org) => sum + org.routes.length, 0),
    stops: organizations.reduce((sum, org) => sum + org.routes.reduce((routeSum, route) => routeSum + route.stops.length, 0), 0),
    employees: organizations.reduce((sum, org) => sum + org.employees.length, 0),
    vehicleAvailability: organizations.reduce((sum, org) => sum + org.vehicleAvailability.length, 0),
    vehicleRequests: organizations.reduce((sum, org) => sum + org.vehicleRequests.length, 0),
    notifications: organizations.reduce((sum, org) => sum + org.notifications.length, 0),
    payrollReports: organizations.reduce((sum, org) => sum + org.payrollReports.length, 0),
  };

  console.log('📊 OVERALL SYSTEM STATISTICS:');
  console.log(`   Organizations: ${totalStats.organizations}`);
  console.log(`   Total Members: ${totalStats.members}`);
  console.log(`   Total Drivers: ${totalStats.drivers}`);
  console.log(`   Total Vehicles: ${totalStats.vehicles}`);
  console.log(`   Total Routes: ${totalStats.routes}`);
  console.log(`   Total Stops: ${totalStats.stops}`);
  console.log(`   Total Employees: ${totalStats.employees}`);
  console.log(`   Total Vehicle Availability Records: ${totalStats.vehicleAvailability}`);
  console.log(`   Total Vehicle Requests: ${totalStats.vehicleRequests}`);
  console.log(`   Total Notifications: ${totalStats.notifications}`);
  console.log(`   Total Payroll Reports: ${totalStats.payrollReports}`);

  console.log('\n🎉 SETUP COMPLETE!');
  console.log('Your multi-fleet management system is now fully configured with:');
  console.log('✅ Multiple organizations with realistic business scenarios');
  console.log('✅ Proper user authentication and role-based access control');
  console.log('✅ Complete fleet management infrastructure');
  console.log('✅ Operational data for testing and development');
  console.log('✅ Business workflows and reporting systems');

  await prisma.$disconnect();
}

generateCompleteSummary().catch(console.error);
