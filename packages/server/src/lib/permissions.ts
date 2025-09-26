import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements as defaultAdminStatements, adminAc, userAc } from 'better-auth/plugins/admin/access';
import { defaultStatements as defaultOrganizationStatements, ownerAc, memberAc, adminAc as organizationAdminAc } from 'better-auth/plugins/organization/access';

export const Adminstatements = {
    ...defaultAdminStatements,

    department: ["create", "read", "update", "delete"],
    shift: ["create", "read", "update", "delete", "assign"],
    employee: ["create", "read", "update", "delete", "assign", "transfer"],
    driver: ["create", "read", "update", "delete", "assign", "activate", "rate"],

    vehicle: ["create", "read", "update", "delete", "assign", "activate", "maintenance"],
    vehicleCategory: ["create", "read", "update", "delete"],
    vehicleAvailability: ["create", "read", "update", "delete"],
    vehicleRequest: ["create", "read", "update", "delete", "approve", "reject"],

    route: ["create", "read", "update", "delete", "assign", "activate", "optimize"],
    stop: ["create", "read", "update", "delete", "assign", "sequence"],
    location: ["create", "read", "update", "delete"],

    payroll: ["create", "read", "update", "delete", "process", "approve", "export"],
    payrollReport: ["create", "read", "update", "delete", "generate", "export"],
    billing: ["read", "write", "manage", "export"],
    
    notification: ["create", "read", "update", "delete", "send", "broadcast"],
    
    analytics: ["read", "export", "dashboard", "reports"],
    reports: ["create", "read", "export", "schedule"],
    
    data: ["read", "write", "export", "import", "backup", "restore"],
} as const;

export const AdminAc = createAccessControl(Adminstatements);


export const Orgstatements = {
    ...defaultOrganizationStatements,

    department: ["create", "read", "update", "delete"],
    shift: ["create", "read", "update", "delete", "assign"],
    employee: ["create", "read", "update", "delete", "assign", "transfer"],
    driver: ["create", "read", "update", "delete", "assign", "activate", "rate"],

    vehicle: ["create", "read", "update", "delete", "assign", "activate", "maintenance"],
    vehicleCategory: ["create", "read", "update", "delete"],
    vehicleAvailability: ["create", "read", "update", "delete"],
    vehicleRequest: ["create", "read", "update", "delete", "approve", "reject"],

    route: ["create", "read", "update", "delete", "assign", "activate", "optimize"],
    stop: ["create", "read", "update", "delete", "assign", "sequence"],
    location: ["create", "read", "update", "delete"],

    payroll: ["create", "read", "update", "delete", "process", "approve", "export"],
    payrollReport: ["create", "read", "update", "delete", "generate", "export"],
    billing: ["read", "write", "manage", "export"],
    
    notification: ["create", "read", "update", "delete", "send", "broadcast"],
    
    analytics: ["read", "export", "dashboard", "reports"],
    reports: ["create", "read", "export", "schedule"],

    sys_user: ["list"],
    
    data: ["read", "write", "export", "import", "backup", "restore"],
} as const;


export const OrgAc = createAccessControl(Orgstatements);

export const superadmin = AdminAc.newRole({
    department: ["create", "read", "update", "delete"],
    shift: ["create", "read", "update", "delete", "assign"],
    employee: ["create", "read", "update", "delete", "assign", "transfer"],
    driver: ["create", "read", "update", "delete", "assign", "activate", "rate"],

    vehicle: ["create", "read", "update", "delete", "assign", "activate", "maintenance"],
    vehicleCategory: ["create", "read", "update", "delete"],
    vehicleAvailability: ["create", "read", "update", "delete"],
    vehicleRequest: ["create", "read", "update", "delete", "approve", "reject"],

    route: ["create", "read", "update", "delete", "assign", "activate", "optimize"],
    stop: ["create", "read", "update", "delete", "assign", "sequence"],
    location: ["create", "read", "update", "delete"],

    payroll: ["create", "read", "update", "delete", "process", "approve", "export"],
    payrollReport: ["create", "read", "update", "delete", "generate", "export"],
    billing: ["read", "write", "manage", "export"],
    
    notification: ["create", "read", "update", "delete", "send", "broadcast"],
    
    analytics: ["read", "export", "dashboard", "reports"],
    reports: ["create", "read", "export", "schedule"],
    
    data: ["read", "write", "export", "import", "backup", "restore"],

    ...adminAc.statements,
    ...ownerAc.statements,
});

export const user = AdminAc.newRole({
    ...userAc.statements,
});


export const owner = OrgAc.newRole({
    department: ["create", "read", "update", "delete"],
    shift: ["create", "read", "update", "delete", "assign"],
    employee: ["create", "read", "update", "delete", "assign", "transfer"],
    driver: ["create", "read", "update", "delete", "assign", "activate", "rate"],

    vehicle: ["create", "read", "update", "delete", "assign", "activate", "maintenance"],
    vehicleCategory: ["create", "read", "update", "delete"],
    vehicleAvailability: ["create", "read", "update", "delete"],
    vehicleRequest: ["create", "read", "update", "delete", "approve", "reject"],

    route: ["create", "read", "update", "delete", "assign", "activate", "optimize"],
    stop: ["create", "read", "update", "delete", "assign", "sequence"],
    location: ["create", "read", "update", "delete"],

    payroll: ["create", "read", "update", "delete", "process", "approve", "export"],
    payrollReport: ["create", "read", "update", "delete", "generate", "export"],
    billing: ["read", "write", "manage", "export"],
    
    notification: ["create", "read", "update", "delete", "send", "broadcast"],
    
    analytics: ["read", "export", "dashboard", "reports"],
    reports: ["create", "read", "export", "schedule"],

    sys_user: ["list"],
    
    ...ownerAc.statements,
});

export const admin = OrgAc.newRole({
    department: ["create", "read", "update", "delete"],
    shift: ["create", "read", "update", "delete", "assign"],
    employee: ["create", "read", "update", "delete", "assign", "transfer"],
    driver: ["create", "read", "update", "delete", "assign", "activate", "rate"],

    vehicle: ["create", "read", "update", "delete", "assign", "activate", "maintenance"],
    vehicleCategory: ["create", "read", "update", "delete"],
    vehicleAvailability: ["create", "read", "update", "delete"],
    vehicleRequest: ["create", "read", "update", "delete", "approve", "reject"],

    route: ["create", "read", "update", "delete", "assign", "activate", "optimize"],
    stop: ["create", "read", "update", "delete", "assign", "sequence"],
    location: ["create", "read", "update", "delete"],

    payroll: ["create", "read", "update", "delete", "process", "approve", "export"],
    payrollReport: ["create", "read", "update", "delete", "generate", "export"],
    billing: ["read", "write", "manage", "export"],
    
    notification: ["create", "read", "update", "delete", "send", "broadcast"],
    
    analytics: ["read", "export", "dashboard", "reports"],
    reports: ["create", "read", "export", "schedule"],

    sys_user: ["list"],
    
    ...organizationAdminAc.statements,
});

export const manager = OrgAc.newRole({
    department: ["read"],
    shift: ["create", "read", "update", "delete", "assign"],
    employee: ["read", "update", "assign"],
    driver: ["read", "update", "assign", "activate", "rate"],

    vehicle: ["read", "update", "assign", "activate", "maintenance"],
    vehicleCategory: ["read"],
    vehicleAvailability: ["create", "read", "update", "delete"],
    vehicleRequest: ["read", "update"],

    route: ["create", "read", "update", "delete", "assign", "activate", "optimize"],
    stop: ["create", "read", "update", "delete", "assign", "sequence"],
    location: ["read", "update"],

    payroll: ["create", "read", "update", "process", "export"],
    payrollReport: ["create", "read", "update", "generate", "export"],
    billing: ["read", "export"],

    notification: ["create", "read", "update", "send", "broadcast"],

    ...memberAc.statements,
});

export const driver = OrgAc.newRole({
    department: ["read"],
    shift: ["read"],
    employee: ["read"],
    driver: ["read"],

    vehicle: ["read"],
    vehicleCategory: ["read"],
    vehicleAvailability: ["read"],

    route: ["read"],
    stop: ["read"],
    location: ["read"],
    ...memberAc.statements,
});

export const employee = OrgAc.newRole({
    department: ["read"],
    shift: ["read"],
    employee: ["read"],
    driver: ["read"],

    vehicle: ["read"],
    vehicleCategory: ["read"],

    route: ["read"],
    stop: ["read"],
    location: ["read"],
    ...memberAc.statements,
});
