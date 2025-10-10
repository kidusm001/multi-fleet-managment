import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { Loader2, Building2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/**
 * Organization Guard Component
 * 
 * Checks if authenticated users have access to organizations.
 * If they don't have any organizations, redirects them to create one.
 * If they have organizations but no active one, helps them select one.
 */
export default function OrganizationGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isChecking, setIsChecking] = useState(true);
  const [needsOrganization, setNeedsOrganization] = useState(false);

  // Debounce ref to prevent rapid organization checks
  const debounceRef = useRef(null);
  
  // Cache ref to track if we've already validated organizations for this session
  const hasValidatedRef = useRef(false);

  // Auth hooks
  const { useSession, useListOrganizations, useActiveOrganization } = authClient;
  const { data: session, isLoading: sessionLoading } = useSession();
  const { data: organizations, isLoading: orgsLoading } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();

  // Reset validation cache when session changes
  useEffect(() => {
    hasValidatedRef.current = false;
  }, [session?.user?.id]);

  // Skip organization checks for certain routes
  const skipRoutes = [
    '/auth/login',
    '/auth/signup', 
    '/organizations',
    '/unauthorized',
    '/profile',
    // Protected routes that should not trigger organization checks
    '/notifications',
    '/vehicles', 
    '/shuttles',
    '/routes',
    '/employees',
    '/dashboard',
    '/settings',
    '/payroll',
    '/organization-management'
  ];

  const shouldSkipCheck = skipRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    // Clear any existing debounce timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't check if we're not authenticated or on excluded routes
    if (!session || shouldSkipCheck || sessionLoading) {
      setIsChecking(false);
      return;
    }

    // If we've already validated organizations for this session and user has active org, skip
    if (hasValidatedRef.current && activeOrganization && organizations?.length > 0) {
      setIsChecking(false);
      return;
    }

    // If still loading organizations, wait and don't redirect
    if (orgsLoading) {
      setIsChecking(true);
      return;
    }

    // Debounce the organization check to prevent rapid re-checks
    debounceRef.current = setTimeout(() => {
      const checkOrganizationAccess = async () => {
        try {
          console.log('OrganizationGuard - Checking organization access:', {
            session: !!session,
            organizations: organizations?.length || 0,
            activeOrganization: activeOrganization?.name || 'none',
            orgsLoading
          });

          // If user has organizations but no active one, set the first one as active
          if (!activeOrganization && organizations?.length > 0) {
            console.log('User has organizations but none active, setting first as active');
            try {
              await authClient.organization.setActive({
                organizationId: organizations[0].id
              });
              console.log('Set active organization to:', organizations[0].name);
              hasValidatedRef.current = true; // Mark as validated
              // Don't navigate away - stay on current route
              return;
            } catch (error) {
              console.error('Failed to set active organization:', error);
              // If setting active fails, redirect to organization selection
              navigate('/organizations', { replace: true });
              return;
            }
          }

          // Only redirect if user has no organizations at all
          if (!organizations || organizations.length === 0) {
            console.log('User has no organizations, redirecting to create one');
            setNeedsOrganization(true);
            navigate('/organizations', { replace: true });
            return;
          }

          // If we get here, validation passed
          hasValidatedRef.current = true;
          console.log('Organization check passed:', {
            organizations: organizations?.length,
            activeOrganization: activeOrganization?.name
          });
        } catch (error) {
          console.error('Error checking organization access:', error);
          // On error, redirect to organization selection to be safe
          navigate('/organizations', { replace: true });
        } finally {
          setIsChecking(false);
        }
      };

      // Only run organization check when we have definitive data
      checkOrganizationAccess();
    }, 200); // 200ms debounce

    // Cleanup function to clear timeout on unmount or dependency change
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [session, organizations, activeOrganization, sessionLoading, orgsLoading, navigate, shouldSkipCheck, location.pathname]);

  // Show loading screen while checking
  if (isChecking || sessionLoading || (session && orgsLoading)) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-slate-900" : "bg-gray-50"
      )}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Building2 className="w-12 h-12 text-primary" />
              <Loader2 className="w-6 h-6 absolute -top-1 -right-1 animate-spin text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Loading Organizations</h2>
          <p className="text-muted-foreground">
            Checking your organization access...
          </p>
        </div>
      </div>
    );
  }

  // Show organization creation prompt if needed
  if (needsOrganization) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-slate-900" : "bg-gray-50"
      )}>
        <div className="text-center max-w-md mx-auto p-6">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Welcome to Fleet Management!</h2>
          <p className="text-muted-foreground mb-4">
            To get started, you&apos;ll need to create or join an organization.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to organization setup...
          </p>
        </div>
      </div>
    );
  }

  // If we get here and user is authenticated but on excluded routes, render children
  if (shouldSkipCheck) {
    return children;
  }

  // If user has organizations and active organization, render children
  if (session && organizations?.length > 0 && activeOrganization) {
    return children;
  }

  // Fallback - shouldn't normally reach here
  return children;
}
