# Organizations Tab

A comprehensive Organizations management tab has been added to the fleet management system.

## Features

### 🏢 Organization Overview
- View active organization details and statistics
- Display key metrics (members, routes, vehicles, employees)
- Show organization metadata (name, slug, creation date)
- Quick access to organization management actions

### 👥 Members Management
- View all organization members
- Manage member roles and permissions
- Send invitations to new members
- Handle member role updates and removals
- Support for teams and dynamic roles (when enabled)

### ⚙️ Organization Settings
- Edit organization basic information (name, slug, description)
- View organization usage statistics and limits
- Manage organization preferences
- Danger zone with organization deletion capability

## Navigation

The Organizations tab is available in the main navigation for:
- **Administrators** (`ROLES.ADMIN`)
- **Managers** (`ROLES.MANAGER`)

## Routes

- Main route: `/organization-management`
- Constant: `ROUTES.ORGANIZATION_MANAGEMENT`

## Components Structure

```
/pages/OrganizationManagement/
├── index.jsx                    # Main organization management page
└── components/
    ├── OrganizationOverview.jsx # Overview tab with stats and info
    ├── OrganizationSettings.jsx # Settings tab with configuration
    └── LocationManagement.jsx   # Locations tab for managing pickup/dropoff locations
```

## Integration

The Organizations tab integrates with existing organization infrastructure:
- Uses `@components/Common/Organizations/OrganizationAdmin` for member management
- Leverages `authClient` hooks for organization data
- Includes location management for pickup/drop-off locations
- Follows existing UI patterns and theming
- Supports both light and dark themes

### Location Management Features

The **Locations** tab provides comprehensive location management:
- **Create** new branch offices and headquarters locations with coordinates
- **Edit** existing location details and types
- **Delete** locations (with validation for active usage)
- **View** location statistics (employee and route counts)
- **Type classification**: Branch Office or Headquarters
- **Coordinate support**: Latitude/longitude for precise mapping
- **Organization-aware caching**: Automatically refreshes data when switching organizations
- **Real-time updates**: Instant cache invalidation on data changes

## API Integration

The components are designed to work with the better-auth organization plugin:
- `useActiveOrganization()` - Get current active organization
- `useListOrganizations()` - List all user organizations
- Organization CRUD operations (create, update, delete)
- Member management operations

## Usage

1. Navigate to the Organizations tab in the main navigation
2. View organization overview with key statistics
3. Switch to Members tab to manage team members
4. Use Locations tab to manage branch offices and headquarters locations
5. Use Settings tab to configure organization preferences
6. Access danger zone for critical operations like deletion

### Location Management Usage
- **Add new branch/headquarters locations** with precise coordinates
- **Manage existing locations** with full edit capabilities  
- **View usage statistics** to understand location utilization
- **Organize locations by type** (Branch Office or Headquarters)
- **Ensure data integrity** with validation and safety checks

## Future Enhancements

- Real-time activity feed
- Organization analytics dashboard
- Advanced permission management
- Audit logs
- Organization billing and subscription management
- Multi-organization switching improvements