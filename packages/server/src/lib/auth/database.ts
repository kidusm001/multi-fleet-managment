import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get user with additional profile data
 */
export async function getUserWithProfile(req: Request, userId?: string) {
  try {
    const targetUserId = userId || req.user?.id;

    if (!targetUserId) {
      throw new Error('User ID required');
    }

    // Get user from Better Auth
    const users = await auth.api.listUsers({
      headers: fromNodeHeaders(req.headers),
      query: { filterField: 'id', filterValue: targetUserId, limit: 1 }
    });

    if (!users?.users?.length) {
      return null;
    }

    const user = users.users[0];

    // Get additional profile data from your database
    const profile = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        employees: {
          include: {
            department: true,
            shift: true
          }
        }
      }
    });

    return {
      ...user,
      profile: profile || null
    };
  } catch (error) {
    console.error('Get user with profile error:', error);
    throw error;
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(req: Request, userId: string, profileData: any) {
  try {
    // Check if user can update this profile
    if (req.user?.id !== userId) {
      // Check if user has permission to update other profiles
      const { canManageUsers } = await import('./permissions');
      const canUpdateOthers = await canManageUsers(req);

      if (!canUpdateOthers) {
        throw new Error('Insufficient permissions to update user profiles');
      }
    }

    // Update profile in your database
    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: profileData
    });

    return updatedProfile;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}

/**
 * Get organization with member details
 */
export async function getOrganizationWithMembers(req: Request, organizationId?: string) {
  try {
    const targetOrgId = organizationId || req.activeOrganization?.id;

    if (!targetOrgId) {
      throw new Error('Organization ID required');
    }

    // Get organization from Better Auth
    const org = await auth.api.getFullOrganization({
      headers: fromNodeHeaders(req.headers),
      query: { organizationId: targetOrgId }
    });

    if (!org) {
      return null;
    }

    // Get additional organization data from your database
    const orgData = await prisma.organization.findUnique({
      where: { id: targetOrgId },
      include: {
        departments: {
          include: {
            employees: {
              include: {
                user: true,
                shift: true
              }
            }
          }
        },
        shifts: true,
        vehicles: {
          include: {
            category: true,
            driver: true
          }
        },
        vehicleCategories: true,
        drivers: true,
        employees: {
          include: {
            user: true,
            department: true,
            shift: true
          }
        },
        vehicleAvailability: true,
        vehicleRequests: true,
        notifications: true,
        payrollReports: true
      }
    });

    return {
      ...org,
      details: orgData
    };
  } catch (error) {
    console.error('Get organization with members error:', error);
    throw error;
  }
}

/**
 * Get user's organizations with full details
 */
export async function getUserOrganizationsWithDetails(req: Request) {
  try {
    if (!req.user) {
      throw new Error('Authentication required');
    }

    // Get organizations from Better Auth
    const organizations = await auth.api.listOrganizations({
      headers: fromNodeHeaders(req.headers)
    });

    if (!organizations?.length) {
      return [];
    }

    // Get additional details for each organization
    const orgsWithDetails = await Promise.all(
      organizations.map(org => getOrganizationWithMembers(req, org.id))
    );

    return orgsWithDetails.filter(Boolean);
  } catch (error) {
    console.error('Get user organizations with details error:', error);
    throw error;
  }
}

/**
 * Create organization with default setup
 */
export async function createOrganizationWithDefaults(req: Request, orgData: any) {
  try {
    // Check if user has permission to create organizations
    const canCreate = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { organization: ['create'] } as any
      }
    });

    if (!canCreate.success) {
      throw new Error('Insufficient permissions to create organization');
    }

    // Create organization using Better Auth
    const org = await auth.api.createOrganization({
      headers: fromNodeHeaders(req.headers),
      body: orgData
    });

    // Set up default organization structure in your database
    if (org?.id) {
      // Create default department
      await prisma.department.create({
        data: {
          id: `dept-${org.id}-default`,
          name: 'Default Department',
          organizationId: org.id
        }
      });

      // Create default shift
      await prisma.shift.create({
        data: {
          id: `shift-${org.id}-default`,
          name: 'Default Shift',
          startTime: new Date('2025-01-01T09:00:00Z'),
          endTime: new Date('2025-01-01T17:00:00Z'),
          timeZone: 'UTC',
          organizationId: org.id
        }
      });
    }

    return org;
  } catch (error) {
    console.error('Create organization with defaults error:', error);
    throw error;
  }
}

/**
 * Get user's dashboard data
 */
export async function getUserDashboardData(req: Request) {
  try {
    if (!req.user) {
      throw new Error('Authentication required');
    }

    const activeOrg = req.activeOrganization;

    if (!activeOrg) {
      return {
        user: req.user,
        organizations: req.organizations || [],
        dashboard: null
      };
    }

    // Get dashboard data from your database
    const dashboardData = await prisma.organization.findUnique({
      where: { id: activeOrg.id },
      include: {
        departments: { include: { employees: true } },
        shifts: true,
        vehicles: { include: { category: true } },
        drivers: { where: { isActive: true } },
        employees: { include: { user: true } },
        vehicleRequests: { where: { status: 'PENDING' } },
        notifications: { where: { status: 'UNREAD' }, take: 5 }
      }
    });

    return {
      user: req.user,
      activeOrganization: activeOrg,
      organizations: req.organizations || [],
      dashboard: dashboardData
    };
  } catch (error) {
    console.error('Get user dashboard data error:', error);
    throw error;
  }
}