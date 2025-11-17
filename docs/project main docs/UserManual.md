# Annex — User Manual

## 1. Purpose

This annex serves the supervisors, coordinators, and dispatchers who use the multi-fleet management portal in their daily work. It explains, in plain language, how to reach the system, sign in, move through the major areas of the interface, and carry out the core transport tasks—creating routes, assigning employees, and monitoring vehicles. The screenshots referenced in each section are included alongside this document so that trainers and end users can follow every step visually.

The manual functions as the official description of the portal as it exists today. Coordinate with your local documentation or training lead whenever screens change so this guide always matches what staff see on site.

### 1.1 How to Use This Manual by Role

Different teams rely on specific portions of the guide. Use the map below to jump straight to the procedures that match your responsibilities.

| Role | Core Responsibilities | Start With |
| --- | --- | --- |
| Super Admin (platform-level) | Provision new tenants, validate compliance packs, hand off to organization contacts | Section 4.1, Section 6 |
| Organization Owner (company-level) | Full control over organization settings, members, and data | Sections 2–3, Section 4.2, Section 5 |
| Organization Admin (company-level) | Manage members, locations, and oversee operations | Sections 2–3, Section 4.2, Section 5 |
| Manager (fleet-level) | Plan routes, manage staffing, maintain vehicles, coordinate daily operations | Sections 2–5 |
| Driver | Review assigned routes, confirm start times, report issues from the field | Sections 2.3, 3.2.3, 4.5, 5.2 |
| Employee | Access basic information and assignments | Sections 2.3, 3.2.3, 5.2 |

## 2. Getting Access

Use this section to confirm that supervisors, coordinators, and dispatchers meet all prerequisites before attempting to sign in.

### 2.1 System Requirements

- Browser: Chrome 116+, Edge 116+, Firefox 115+, or Safari 16+ to ensure pages and animations display correctly.
- Screen size: 1440×900 or higher so tables and dashboards appear without horizontal scrolling.
- Network: Reliable, secure connection to your tenant portal and the optimizer service used for routing suggestions.
- Account: BetterAuth login with **Manager** or **Admin** access. If you are unsure about your permissions, contact your operations lead before the shift begins.

### 2.2 Preparing to Sign In

1. Confirm VPN status if your organization restricts access to the corporate network.
2. Open the URL supplied by the operations handbook or your onboarding email.
3. If you recently used a training or staging site, clear saved site data to prevent sign-in conflicts.
4. Bookmark the landing page so supervisors and dispatchers can return quickly during busy periods.

### 2.3 Signing In and Choosing an Organization

1. Visit the tenant URL; the login page shows the Routegna logo and sign-in options. See `Greeting.png` and `Organization_Management/Login_Page.png`.
2. Choose your sign-in method:
    - Enter your email and password, then click **Sign In**.
    - Or click **Continue with Fayda** to use your organization’s SSO provider.
3. If this is your first time or you belong to multiple organizations, you’ll be taken to the organization selection page. Choose the organization you want to work with from the list, or create a new one if authorized. See `Organization_Management/Select_Organization_Page.png`.
4. Once an organization is selected, you’ll enter the main portal. The choice stays active until you sign out.

## 3. Daily Navigation

These routines cover the areas that dispatch teams visit throughout the day.

### 3.1 Exploring the Home Dashboard

After signing in and selecting an organization, you’ll land on the home page, which serves as a welcome screen for the multi-fleet management system. This page displays the Routegna logo, a brief welcome message, and navigation options to get started.

- Click **Go to Dashboard** to access the main operational view where you can monitor routes, view statistics, and manage daily operations.
- Click **Learn More** to access additional information about the system.

### 3.2 Working in the Dashboard

The dashboard is your central hub for monitoring and managing fleet operations. It provides real-time insights into route activity and quick access to route management tools.

- **Statistics Cards**: At the top of the screen, you’ll see key metrics including the number of active routes, total passengers, and total stops across all routes.
- **Interactive Map**: The main area displays a map showing all active routes with employee pickup locations marked.
- **Route List**: On desktop, a sidebar on the left shows a searchable and filterable list of routes. On mobile, this appears as a bottom sheet that can be pulled up.
- **Search and Filter**: Use the search bar to find routes by name, shuttle, or employee. Filter routes by status (active, inactive, etc.) to focus on specific routes.
- **Route Details**: Click on any route in the list to view detailed information including passenger assignments, stops, and route metrics. On desktop, this opens in a side panel; on mobile, it expands the selected route.
- **Route Selection**: Select individual routes or use the selection mode to choose multiple routes for bulk operations.

### 3.3 Working in the Route Management Area

Navigate to **Routes** from the main navigation menu to access comprehensive route management tools. This area provides three main views for different aspects of route planning and management.

### 3.3.1 Management View

The management view displays all routes in your organization with flexible viewing options and powerful filtering capabilities.

**Choosing Your View Mode:**
- **Grid View**: Shows routes as cards in a responsive grid layout, perfect for getting an overview of multiple routes at once
- **List View**: Displays routes as expanded cards in a single column, giving you more space to see route details
- **Table View**: Presents routes in a compact spreadsheet format, ideal for scanning through many routes quickly

**Understanding the Statistics Panel:**
At the top of the view, you’ll see summary statistics that update based on your current filters:
- Total number of routes matching your criteria
- Number of active routes currently running
- Overall utilization metrics across your fleet

**Using the Search and Filter Bar:**
The search and filter bar helps you narrow down routes to exactly what you need to see:
- **Search Box**: Type any part of a route name, route ID, shuttle name, or employee name to find specific routes
- **Status Filter**: Choose to see “All Status,” “Active” routes only, or “Inactive” routes only
- **Shuttle Filter**: Filter routes by specific shuttles or vehicles in your fleet
- **Department Filter**: Show only routes that include employees from particular departments
- **Shift Filter**: Focus on routes for specific work shifts

**Reading Route Cards:**
Each route appears as a card showing key information at a glance:
- Route number and name at the top
- Shuttle or vehicle assignment with an icon
- Associated shift information
- Current status (Active/Inactive) with color coding
- Quick stats: number of stops, passenger count, total time, and end time
- Action buttons for viewing the route map or deleting the route

**Selecting and Managing Multiple Routes:**
- Click the “Select Routes” button to enter selection mode
- Check the boxes on route cards to select multiple routes
- Use “Delete Selected” to remove multiple routes at once, or “Cancel” to exit selection mode

**Viewing Detailed Route Information:**
- Click anywhere on a route card (when not in selection mode) to open the detailed route drawer
- The drawer slides up from the bottom with two main tabs:
- **Overview Tab**: Shows comprehensive route summary including total stops, passenger count, time and distance metrics, and schedule information. Click “View Route Map” to see the route plotted on an interactive map.
- **Passengers Tab**: Lists all passengers on the route in pickup order, showing their names, departments, and locations. You can select individual passengers or use bulk selection to remove multiple passengers at once.

**Route Actions in Detail View:**
- **Activate/Deactivate**: Toggle whether a route is currently active and accepting passengers
- **Delete Route**: Permanently remove the route (requires confirmation)
- **Remove Passengers**: Select passengers and remove them from the route, which automatically recalculates the route metrics
- **View Map**: Open an interactive map showing the complete route path and all pickup locations

**Pagination and Navigation:**
When viewing many routes, use the pagination controls at the bottom:
- Navigate between pages using arrow buttons or page numbers
- See total number of routes and current page position
- Items per page can be adjusted in the “View Options” menu (6, 9, or 12 items per page)

### 3.3.2 Creating Routes

Use the route creation tools to build new routes from scratch. The process guides you through selecting parameters and assigning employees step by step.

**Starting the Creation Process:**
- Click on the “Create Route” tab in the Route Management area
- The system will guide you through a step-by-step process to build your route

**Step 1: Select a Shift**
- Choose from the available work shifts in your organization
- The system will show you the time range for each shift (start and end times)
- Selecting a shift determines which employees are available for assignment

**Step 2: Choose a Location**
- Narrow down employees by their work location if needed
- This helps focus on employees from specific sites or departments
- You can skip this step to see all employees for the selected shift

**Step 3: Review Available Employees**
- The system displays all unassigned employees for your selected shift and location
- Each employee shows their name, department, and work location
- The list updates automatically as you make selections

**Step 4: Select Employees for the Route**
- Check the boxes next to employees you want to include on this route
- You can select individual employees or use bulk selection methods
- The system may suggest optimized groupings based on employee locations and travel patterns

**Step 5: Choose a Shuttle**
- Review available shuttles that have capacity for your selected number of employees
- Each shuttle shows its name, capacity, and current availability
- The system highlights shuttles that can accommodate your employee selection

**Step 6: Review Route Suggestions**
- After selecting a shuttle, the system generates route optimization suggestions
- These suggestions consider employee pickup locations and travel efficiency
- You can modify the suggested employee order if needed

**Step 7: Preview the Route**
- Click “Preview Route” to see the complete route on an interactive map
- The preview shows:
- Pickup sequence for all employees
- Total distance and estimated travel time
- Route path visualization
- Any potential issues or optimizations

**Step 8: Finalize and Save**
- Enter a descriptive name for the route (or use the system’s suggestion)
- Review all route details one final time
- Click “Create Route” to save and activate the route
- The system confirms successful creation and returns you to the management view

**Important Notes:**
- Routes should not exceed 90 minutes total travel time
- The system automatically calculates optimal pickup sequences
- You can modify routes after creation using the management view

### 3.3.3 Route Assignment

Use the assignment tools to place remaining unassigned employees on existing routes that have available capacity.

**Accessing the Assignment View:**
- Click on the “Assignment” tab in the Route Management area
- This view focuses specifically on filling empty seats on existing routes

**Step 1: Select a Shift**
- Choose the shift you want to work with from the dropdown
- The system will show shift timing information for reference
- This determines which employees and routes are available for assignment

**Step 2: Review Unassigned Employees**
- The system displays all employees in the selected shift who don’t have route assignments
- Employees are organized by department and location
- You can filter the list by department if needed

**Step 3: Review Available Routes**
- The right panel shows all routes for the selected shift that have empty seats
- Each route displays:
- Route name and current passenger count
- Shuttle name and total capacity
- Available seats remaining
- Location information

**Step 4: Select a Route for Assignment**
- Click on any route in the available routes list
- The system highlights your selection and prepares for employee assignment
- You can see detailed information about the route’s current passengers and capacity

**Step 5: Assign Employees**
- Click the “Assign” button to open the assignment modal
- Review the route details and current metrics
- Select employees from the unassigned list
- The system shows how adding each employee will affect total travel time and distance

**Step 6: Confirm the Assignment**
- Review the updated route metrics after adding the employee
- Confirm that the new total time stays within acceptable limits (under 90 minutes)
- Click “Confirm” to complete the assignment

**Step 7: Continue Assignments**
- The system updates the unassigned employees list automatically
- Continue assigning employees to routes as needed
- The available routes list updates to reflect new passenger counts

**Assignment Best Practices:**
- Prioritize employees by location proximity to minimize additional travel time
- Monitor total route time to avoid exceeding operational limits
- Use the route preview feature if you need to see the updated route path
- Save frequently when making multiple assignments

## 4. Role-Specific Procedures

Use these playbooks when you need deeper guidance tailored to your role.

### 4.1 Tenant Administration [Super Admin]

Super Admin teams provision tenants, verify legal agreements, and hand off clean environments to organization contacts.

**Accessing the Tenant Portal:**
1. Sign in to the platform-level admin portal using your Super Admin credentials.
2. Navigate to the “Tenants” or “Organizations” section from the main dashboard.
3. Click “Create New Tenant” to begin the provisioning process.

**Creating a New Tenant:**
1. Enter the organization name exactly as provided in the legal agreement.
2. Set up the unique tenant identifier (slug) that will be used for the organization’s URL.
3. Configure the initial admin contact details, including email and phone number.
4. Set the tenant’s geographic region for data residency compliance.
5. Review and accept the service agreement terms on behalf of the organization.
6. Click “Provision Tenant” to create the environment.

**Configuring Initial Settings:**
1. Set up the organization’s basic profile information.
2. Configure default security policies and MFA requirements.
3. Establish initial user roles and permission templates.
4. Set up billing and subscription details if applicable.
5. Configure any custom branding elements provided by the organization.

**Verifying Compliance and Readiness:**
1. Review the tenant’s compliance checklist to ensure all legal requirements are met.
2. Verify that the initial admin user can sign in and access basic features.
3. Check that all required data processing agreements are in place.
4. Document the handoff details, including access credentials and contact information.

**Handing Off to Organization Contacts:**
1. Send the welcome email with login instructions to the designated organization contact.
2. Provide documentation on initial setup steps for the organization admin.
3. Schedule a handoff meeting to walk through the system and answer questions.
4. Monitor the first few days of usage to ensure smooth transition.
5. Keep records of the provisioning for audit and support purposes.

### 4.2 Organization Administration [Organization Owner/Admin]

Organization Owners and Admins manage the overall organization structure, including members, locations, and settings.

**Accessing Organization Management:**
1. Sign in to the portal and select your organization if prompted.
2. Navigate to “Organization” from the main menu to access the management interface.
3. The page opens with four main tabs: Overview, Members, Locations, and Settings.

**Managing Organization Overview:**
1. Review the organization header showing your organization’s name, slug, and creation date.
2. Check the statistics cards displaying total members, active routes, active vehicles, and total employees.
3. Examine the organization details section with name, slug, description, and your current role.
4. Note any recent activity (this feature is currently under development).
5. Click “Edit Organization” if you need to modify basic organization information.

**Managing Organization Members:**
1. Click on the “Members” tab to access member management.
2. Review the current member count and search through the list using the search bar.
3. Filter members by department, shift, status, or assignment status using the dropdown filters.
4. To add a new member, click “Add Member” and enter their user ID or email address.
5. Select the appropriate role (Owner, Admin, Manager, Driver, or Employee) for the new member.
6. Alternatively, click “Invite Member” to send an email invitation with role assignment.
7. To modify an existing member’s role, click the role change button next to their name and select the new role.
8. To remove a member, click the remove button and confirm the action (note that owners cannot be removed).
9. Monitor member activity and ensure roles align with organizational responsibilities.

**Managing Organization Locations:**
1. Click on the “Locations” tab to view and manage branch offices and headquarters.
2. Review the list of existing locations, including their addresses, types (Branch or HQ), and usage statistics.
3. To add a new location, click “Add Location” and fill in the required details.
4. Enter the full address of the location.
5. Provide the precise latitude and longitude coordinates.
6. Select the location type (Branch Office or Headquarters).
7. Click “Create Location” to save the new location.
8. To edit an existing location, click the “Edit” button on the location card.
9. Update any of the location details as needed and click “Update Location”.
10. To remove a location, click “Delete” and confirm - note that locations with active employees or routes cannot be deleted.
11. Use the “Refresh” button to update location data if needed.

**Managing Organization Settings:**
1. Click on the “Settings” tab to access organization configuration options.
2. In the General Settings section, click “Edit” to modify organization information.
3. Update the organization name, slug, or description as needed.
4. Click “Save Changes” to apply your modifications.
5. Review the Organization Statistics section showing current usage metrics.
6. If needed, access the Danger Zone by clicking the eye icon to reveal destructive actions.
7. To delete the organization, click “Delete Organization” and confirm multiple times - this action cannot be undone.

### 4.3 Managing Workforce Coverage [Manager]

Fleet Managers and staffing leads use the employee panels to balance shifts and respond to live staffing gaps.

**Accessing Employee Management:**
1. Navigate to “Employees” from the main menu to open the employee management interface.
2. Review the statistics section at the top showing total employees, assignment status, and location distribution.

**Reviewing Employee Statistics:**
1. Check the total number of employees in your organization.
2. Note how many employees are currently assigned to routes versus unassigned.
3. Review the assignment percentage to understand coverage levels.
4. Identify the most common employee location for logistical planning.
5. Monitor the count of active employees versus inactive ones.

**Managing the Employee List:**
1. Use the department filter to show employees from specific departments.
2. Apply the shift filter to focus on employees working particular shifts.
3. Filter by status to see active, inactive, or all employees.
4. Use the assignment filter to view only assigned or unassigned employees.
5. Browse through the paginated employee table showing detailed information.
6. Review employee details including name, department, shift, location, and assignment status.

**Activating or Deactivating Employees:**
1. Locate the employee you need to modify in the table.
2. For inactive employees, click the “Activate” button to restore their access.
3. For active employees, click the “Deactivate” button to temporarily remove them from active duty.
4. Confirm the action when prompted.
5. The employee’s status will update immediately in the table and statistics.

**Adding New Employees:**
1. Click “Add Employee” from the employee management interface.
2. Fill in the employee’s personal information including name and contact details.
3. Assign the employee to a department and shift.
4. Set their work location and any special accommodations.
5. Specify their certifications and qualifications.
6. Save the employee record to add them to the system.

**Managing Employee Assignments:**
1. Review unassigned employees to identify staffing gaps.
2. Check route requirements against available employee skills.
3. Assign employees to routes through the Route Management interface.
4. Monitor assignment changes in the employee statistics.
5. Adjust assignments as needed based on daily operational requirements.

### 4.4 Maintaining the Shuttle Fleet [Manager]

Fleet Managers monitor capacity, maintenance windows, and accessibility commitments inside the shuttle workspace.

**Accessing Shuttle Management:**
1. Navigate to “Shuttles” from the main menu to open the shuttle management dashboard.
2. Review the statistics cards showing total shuttles, active shuttles, and maintenance status.

**Reviewing Fleet Statistics:**
1. Check the total number of shuttles in your fleet.
2. Monitor how many shuttles are currently active and available for use.
3. Review maintenance statistics including urgent, ongoing, and scheduled maintenance items.
4. Note any urgent maintenance items requiring immediate attention.

**Managing the Shuttle Inventory:**
1. Browse the shuttle table showing all vehicles in your fleet.
2. Review shuttle details including capacity, current status, and maintenance schedule.
3. Check accessibility features and special equipment for each shuttle.
4. Monitor shuttle assignments and utilization rates.

**Handling Maintenance Scheduling:**
1. Review the maintenance schedule section showing upcoming service requirements.
2. Identify shuttles with urgent maintenance needs (due within 1-3 days).
3. Check ongoing maintenance items and their expected completion dates.
4. Schedule routine maintenance to prevent service disruptions.
5. Update maintenance records after completed work.

**Processing Shuttle Requests:**
1. If you have admin privileges, review the pending shuttle requests table.
2. Examine each request for vehicle type, capacity requirements, and timing.
3. Approve or deny requests based on availability and operational needs.
4. Assign specific shuttles to approved requests.
5. Communicate assignment details to requesting departments.

**Monitoring Driver Status:**
1. Check the driver status sidebar for current driver availability.
2. Review driver assignments and route statuses.
3. Identify any driver issues or scheduling conflicts.
4. Coordinate with drivers for maintenance-related vehicle changes.

**Updating Shuttle Information:**
1. Edit shuttle details including capacity, accessibility features, and equipment.
2. Update maintenance schedules and service records.
3. Modify shuttle assignments as operational needs change.
4. Ensure all shuttle information remains current and accurate.

### 4.5 Briefing Drivers on Assignments [Driver & Manager]

Drivers generally receive read-only accounts or rely on dispatcher briefings. Use these steps to keep the field team aligned.

**Preparing for Driver Briefing:**
1. Ensure all routes are finalized and assignments are confirmed in the system.
2. Open the Route Management interface and navigate to the “Management” view.
3. Filter routes by the relevant shift and status to focus on active assignments.

**Reviewing Route Details:**
1. Select a specific route from the list to open its detailed view.
2. Examine the route overview showing total stops, passenger count, time and distance metrics.
3. Review the passenger list in pickup order, noting names, departments, and locations.
4. Check the route schedule and timing information.
5. Verify shuttle assignment and capacity details.

**Accessing Route Maps:**
1. Click “View Route Map” in the route details to see the planned path.
2. Review pickup locations marked on the interactive map.
3. Note any special routing considerations or landmarks.
4. Confirm the route optimization and pickup sequence.

**Sharing Information with Drivers:**
1. Export or screenshot the route details for sharing.
2. Provide the driver with passenger list and pickup sequence.
3. Share timing information including start time and estimated duration.
4. Communicate any special instructions or passenger requirements.
5. Note shuttle details including vehicle number and capacity.

**Driver Self-Review Process:**
1. Drivers with portal access should sign in using their credentials.
2. Navigate to “Routes” and select “Management” view.
3. Locate their assigned route using search or filter options.
4. Open the route details drawer to review all assignment information.
5. Confirm passenger list, timing, and shuttle details before departure.

**Handling Route Changes:**
1. If routes are modified after briefing, immediately notify affected drivers.
2. Provide updated route information and timing.
3. Confirm driver acknowledgment of changes.
4. Document any communication for operational records.

**Reporting and Escalation:**
1. Instruct drivers to report any variances during execution.
2. Note common issues like late passengers, road closures, or safety concerns.
3. Provide escalation channels for urgent issues during operation.
4. Review reported issues to improve future planning and briefings.

## 5. Staying Informed and Supported

Keep these references close when questions or issues arise.

### 5.1 Using Notifications, Audit Trail, and Help

- Notifications appear beside the page header and reflect server-side audit events.
- The help icon opens contextual documentation. Inline tooltips surface policy reminders, such as the 90-minute route limit.

The notifications system provides alerts for route changes, shuttle maintenance, and system updates. Users can filter notifications by type (routes, shuttles, all) and status (read/unread), with bulk management options for multiple items. The audit trail maintains a chronological record of system activities for compliance purposes.

### 5.2 Handling Errors and Getting Support

The system provides clear error messages and help features to resolve common issues. For problems that cannot be resolved through built-in help, contact your organization’s IT support team or designated technical support channels.

**Common Error Types:**
- **Validation Errors**: Red outlines on required fields with specific error messages
- **Capacity Limits**: Warnings when vehicle capacity or route time limits are exceeded

- **Network Issues**: Connection problems with automatic retry suggestions
- **Permission Errors**: Access denied messages when attempting unauthorized actions

**Reporting Issues:**
When encountering persistent problems, gather the exact error message, timestamp, and steps to reproduce before contacting support. Include screenshots of error messages and relevant system state information.

### 5.3 Monitoring System Health and Performance

The system provides real-time monitoring through dashboard statistics and automated alerts. Key metrics include route status, employee coverage, vehicle utilization, and performance indicators. System notifications alert users to unusual conditions, with automatic updates reflecting current operational state.

**System Alerts:**
- **Performance Issues**: Slow response times or operation failures trigger alerts
- **Data Synchronization**: Cache clearing and data refresh options for consistency issues

- **Service Outages**: Status monitoring with contingency procedures during downtime

### 5.4 Best Practices for System Usage

**Data Quality:**
- Regularly audit employee and location information for accuracy
- Use consistent formatting for all data entry
- Complete all required fields and validate before saving
- Apply bulk operations carefully to maintain data integrity

**Performance Optimization:**
- Use search and filter options to quickly find information
- Plan route creation and batch assignments to minimize interactions
- Review routes and assignments before finalizing
- Archive old data and perform regular cleanup

**Security and Compliance:**
- Never share login credentials and log out when finished
- Understand role permissions and work within them
- Handle sensitive data according to privacy policies
- Report security incidents through proper channels

## 6. Reference

### 6.1 Integration and Connectivity

### 6.1.1 Third-Party Integrations

The system connects with various external services and applications:

**Communication Tools:**
1. **Email Integration**: Send notifications via email services
2. **SMS Services**: Send text message alerts for critical updates
3. **Slack Integration**: Receive notifications in Slack channels
4. **Microsoft Teams**: Integration with Teams for notifications
5. **Webhook Support**: Custom webhook integrations for real-time updates

**Mapping and Location Services:**
1. **Mapbox Integration**: Interactive maps for route visualization
2. **Google Maps**: Alternative mapping service support
3. **GPS Integration**: Real-time GPS tracking for vehicles
4. **Address Validation**: Automatic address verification and geocoding
5. **Route Optimization**: Integration with routing optimization services

**Document Management:**
1. **Cloud Storage**: Integration with Google Drive, OneDrive, Dropbox
2. **Document Generation**: Automatic PDF and document creation
3. **Digital Signatures**: Electronic signature integration
4. **Document Scanning**: Mobile document capture and processing
5. **Version Control**: Document versioning and change tracking

**Calendar and Scheduling:**
1. **Google Calendar**: Sync schedules with Google Calendar
2. **Outlook Integration**: Microsoft Outlook calendar synchronization
3. **Meeting Scheduling**: Automated meeting and appointment booking
4. **Resource Booking**: Equipment and facility reservation systems
5. **Time Tracking**: Integration with time tracking and attendance systems

### 6.1.2 Responsive Web Application

The system is designed as a responsive web application that adapts to mobile devices and tablets through web browsers, providing full functionality across all screen sizes.

**Responsive Web Features:**
1. **Adaptive Layout**: Interface automatically adjusts to fit mobile, tablet, and desktop screens
2. **Touch-Optimized Controls**: Large, touch-friendly buttons and navigation elements
3. **Mobile Maps**: Interactive maps optimized for touch navigation and smaller screens
4. **Progressive Web App**: Can be installed on mobile devices for app-like experience
5. **Offline Capability**: Limited offline functionality for viewing critical information

**Mobile Web Data Entry:**
1. **Touch Keyboard**: Optimized keyboard layouts for mobile data input
2. **Voice Input**: Support for voice-to-text input on compatible devices
3. **Camera Integration**: Photo capture and upload through mobile browser APIs
4. **Location Services**: GPS access for location-based features through browser permissions
5. **Accelerometer**: Motion-based interactions where supported by the device

**Mobile Web Security:**
1. **Browser Security**: Inherits security features from modern web browsers
2. **HTTPS Encryption**: All connections secured with SSL/TLS encryption
3. **Session Management**: Secure session handling adapted for mobile usage patterns
4. **Data Protection**: Same security measures as desktop version
5. **Device Management**: Compatible with mobile device management systems

### 6.2 Compliance and Security Reference

### 6.2.1 Data Privacy Compliance

The system adheres to data privacy regulations and best practices:

**GDPR Compliance:**
1. **Data Collection**: Transparent data collection practices
2. **User Consent**: Clear consent mechanisms for data processing
3. **Data Rights**: Support for data access, correction, and deletion requests
4. **Data Portability**: Ability to export user data in standard formats
5. **Privacy Notices**: Clear privacy policy and data usage information

**Data Security Measures:**
1. **Encryption**: Data encrypted in transit and at rest
2. **Access Controls**: Role-based access to sensitive information
3. **Audit Logging**: Comprehensive logging of data access and changes
4. **Data Minimization**: Collection of only necessary data
5. **Retention Policies**: Defined data retention and deletion schedules

**User Data Rights:**
1. **Access Requests**: Users can request access to their data
2. **Correction Rights**: Ability to correct inaccurate personal data
3. **Deletion Rights**: Right to request data deletion
4. **Portability Rights**: Data export capabilities
5. **Objection Rights**: Ability to object to certain data processing

### 6.2.2 Security Features

Built-in security measures protect your data and operations:

**Authentication Security:**
1. **Multi-Factor Authentication**: Optional two-factor authentication
2. **Session Management**: Automatic session timeout and management
3. **Password Policies**: Strong password requirements and policies
4. **Account Lockout**: Protection against brute force attacks
5. **Single Sign-On**: Integration with corporate SSO systems

**Network Security:**
1. **SSL/TLS Encryption**: All connections use secure protocols
2. **Firewall Protection**: Network-level security measures
3. **DDoS Protection**: Protection against denial of service attacks
4. **IP Whitelisting**: Optional IP address restrictions
5. **VPN Support**: Compatible with corporate VPN requirements

**Data Protection:**
1. **Backup Encryption**: Encrypted backup storage
2. **Data Masking**: Sensitive data masking in logs and displays
3. **Secure Deletion**: Secure data deletion methods
4. **Access Logging**: Detailed logging of all data access
5. **Incident Response**: Established security incident procedures

### 6.3 System Limits and Performance

### 6.3.1 Operational Limits

Understanding system capacity and limitations:

**Route Limits:**
1. **Maximum Route Duration**: 90 minutes per route
2. **Maximum Passengers**: Based on vehicle capacity, typically 12-15
3. **Route Planning Horizon**: Up to 30 days in advance
4. **Active Routes**: Unlimited concurrent active routes
5. **Route History**: 2 years of historical route data retained

**User Limits:**
1. **Organization Size**: Up to 10,000 active users per organization
2. **Concurrent Users**: Up to 500 simultaneous users
3. **Storage Quota**: 100 GB per organization
4. **API Rate Limits**: 1000 requests per hour per user
5. **File Upload Size**: 50 MB maximum file size

**Data Limits:**
1. **Database Records**: Millions of records supported
2. **Report Generation**: Up to 100,000 records per report
3. **Export Size**: Up to 1 million records per export
4. **Search Results**: 10,000 results maximum per search
5. **Audit Log Retention**: 7 years of audit data retained

### 6.3.2 Performance Guidelines

Optimizing system performance for your organization:

**Optimal Usage Patterns:**
1. **Batch Operations**: Use bulk operations for large data sets
2. **Scheduled Processing**: Run intensive operations during off-peak hours
3. **Data Filtering**: Apply filters to limit data processing
4. **Caching**: Utilize browser caching for better performance
5. **Connection Optimization**: Use stable network connections

**Performance Monitoring:**
1. **Response Times**: Typical response times under 2 seconds
2. **Throughput**: Up to 100 concurrent operations
3. **Uptime**: 99.9% service availability
4. **Backup Times**: Automated backups completed within 4 hours
5. **Report Generation**: Complex reports completed within 5 minutes

**Scalability Considerations:**
1. **User Growth**: System scales with organization size
2. **Data Volume**: Performance maintained with growing data sets
3. **Feature Usage**: Additional features may impact performance
4. **Integration Load**: External integrations monitored for performance impact
5. **Resource Allocation**: Automatic resource scaling as needed

### 6.4 Glossary

### 6.4.1 Core Terminology

Essential terms and definitions:

**Active Route**: A route that is currently in progress or scheduled to begin within the next hour.

**API (Application Programming Interface)**: A set of rules and protocols for accessing system functions programmatically.

**Audit Trail**: A chronological record of system activities and user actions for compliance and security purposes.

**BetterAuth**: The authentication system used to secure user accounts and manage access permissions.

**Cluster Recommendation**: Employee grouping suggestions generated by optimization algorithms to minimize travel time.

**Dashboard**: The main operational view showing maps, statistics, and quick access to key functions.

**Department**: An organizational unit within the company, such as Engineering, Marketing, or Operations.

**Employee**: A worker who can be assigned to routes and tracked within the system.

**Express.js**: The backend framework used to build the system’s API endpoints and handle server-side logic.

**Fleet**: The complete set of vehicles (shuttles) managed by the organization.

**Geocoding**: The process of converting addresses into geographic coordinates for mapping purposes.

**GPS (Global Positioning System)**: Satellite-based navigation system used for vehicle tracking and route guidance.

**Heat Map**: A visual representation showing concentration of data points, such as employee locations.

**Integration**: The connection between the system and external applications or services.

**Location**: A physical address or coordinate point used for route planning and employee pickup.

**Maintenance Window**: A scheduled time period when the system may be unavailable for updates or maintenance.

**Mapbox**: The mapping service used to display interactive maps and route visualizations.

**Middleware**: Software that connects different applications and handles communication between them.

**Notification**: A system-generated message alerting users to important events or updates.

**Optimization**: The process of finding the most efficient route or assignment using algorithmic calculations.

**Organization**: A company or entity that uses the system, containing members, locations, and settings.

**Pagination**: The division of large data sets into smaller, more manageable pages.

**Permission**: A specific access right granted to users based on their role.

**Prisma**: The database toolkit used for data modeling, migrations, and database access.

**React**: The JavaScript library used to build the user interface components.

**Route**: A planned transportation path including pickup locations, vehicle assignment, and timing.

**RouteGNA**: The company name and brand for this multi-fleet management system.

**Shift**: A defined work period, such as morning shift (8 AM - 4 PM) or evening shift (4 PM - 12 AM).

**Shuttle**: A vehicle used for employee transportation, with defined capacity and features.

**SLA (Service Level Agreement)**: A contract defining the expected level of service, including uptime and response times.

**Stop**: A specific location where employees are picked up or dropped off during a route.

**Tailwind CSS**: The utility-first CSS framework used for styling the user interface.

**Tenant**: An isolated instance of the system for a specific organization or client.

**Toast**: A small, temporary notification that appears on screen to provide feedback.

**TypeScript**: The programming language used for type-safe JavaScript development.

**UI (User Interface)**: The visual elements and controls that users interact with.

**UX (User Experience)**: The overall experience of using the system, including ease of use and satisfaction.

**Vehicle Category**: A classification of vehicles by type, capacity, or special features.

**Webhook**: A way for the system to send real-time notifications to external applications.

**Zod**: The TypeScript-first schema validation library used for data validation.