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
    └── OrganizationSettings.jsx # Settings tab with configuration
```

## Integration

The Organizations tab integrates with existing organization infrastructure:
- Uses `@components/Common/Organizations/OrganizationAdmin` for member management
- Leverages `authClient` hooks for organization data
- Follows existing UI patterns and theming
- Supports both light and dark themes

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
4. Use Settings tab to configure organization preferences
5. Access danger zone for critical operations like deletion

## Future Enhancements

- Real-time activity feed
- Organization analytics dashboard
- Advanced permission management
- Audit logs
- Organization billing and subscription management
- Multi-organization switching improvements