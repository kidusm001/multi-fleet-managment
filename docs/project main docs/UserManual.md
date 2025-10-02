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
2. Open the tenant URL supplied by the operations handbook or your onboarding email.
3. If you recently used a training or staging site, clear saved site data to prevent sign-in conflicts.
4. Bookmark the landing page so supervisors and dispatchers can return quickly during busy periods.

### 2.3 Signing In and Choosing an Organization
1. Visit the tenant URL; the login page shows the Routegna logo and sign-in options. See `Greeting.png` and `Organization_Management/Login_Page.png`.
2. Choose your sign-in method:
   - Enter your email and password, then click **Sign In**.
   - Or click **Continue with Fayda** to use your organization's SSO provider.
3. If this is your first time or you belong to multiple organizations, you'll be taken to the organization selection page. Choose the organization you want to work with from the list, or create a new one if authorized. See `Organization_Management/Select_Organization_Page.png`.
4. Once an organization is selected, you'll enter the main portal. The choice stays active until you sign out.

## 3. Daily Navigation
These routines cover the areas that dispatch teams visit throughout the day.

### 3.1 Exploring the Home Dashboard
After signing in and selecting an organization, you'll land on the home page, which serves as a welcome screen for the multi-fleet management system. This page displays the Routegna logo, a brief welcome message, and navigation options to get started.

- Click **Go to Dashboard** to access the main operational view where you can monitor routes, view statistics, and manage daily operations.
- Click **Learn More** to access additional information about the system.

### 3.2 Working in the Dashboard
The dashboard is your central hub for monitoring and managing fleet operations. It provides real-time insights into route activity and quick access to route management tools.

- **Statistics Cards**: At the top of the screen, you'll see key metrics including the number of active routes, total passengers, and total stops across all routes.
- **Interactive Map**: The main area displays a map showing all active routes with employee pickup locations marked.
- **Route List**: On desktop, a sidebar on the left shows a searchable and filterable list of routes. On mobile, this appears as a bottom sheet that can be pulled up.
- **Search and Filter**: Use the search bar to find routes by name, shuttle, or employee. Filter routes by status (active, inactive, etc.) to focus on specific routes.
- **Route Details**: Click on any route in the list to view detailed information including passenger assignments, stops, and route metrics. On desktop, this opens in a side panel; on mobile, it expands the selected route.
- **Route Selection**: Select individual routes or use the selection mode to choose multiple routes for bulk operations.

### 3.3 Working in the Route Management Area
Navigate to **Routes** from the main navigation menu to access comprehensive route management tools. This area provides three main views for different aspects of route planning and management.

### 3.3 Working in the Route Management Area
Navigate to **Routes** from the main navigation menu to access comprehensive route management tools. This area provides three main views for different aspects of route planning and management.

#### 3.3.1 Management View
The management view displays all routes in your organization with flexible viewing options and powerful filtering capabilities.

**Choosing Your View Mode:**
- **Grid View**: Shows routes as cards in a responsive grid layout, perfect for getting an overview of multiple routes at once
- **List View**: Displays routes as expanded cards in a single column, giving you more space to see route details
- **Table View**: Presents routes in a compact spreadsheet format, ideal for scanning through many routes quickly

**Understanding the Statistics Panel:**
At the top of the view, you'll see summary statistics that update based on your current filters:
- Total number of routes matching your criteria
- Number of active routes currently running
- Overall utilization metrics across your fleet

**Using the Search and Filter Bar:**
The search and filter bar helps you narrow down routes to exactly what you need to see:
- **Search Box**: Type any part of a route name, route ID, shuttle name, or employee name to find specific routes
- **Status Filter**: Choose to see "All Status," "Active" routes only, or "Inactive" routes only
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
- Click the "Select Routes" button to enter selection mode
- Check the boxes on route cards to select multiple routes
- Use "Delete Selected" to remove multiple routes at once, or "Cancel" to exit selection mode

**Viewing Detailed Route Information:**
- Click anywhere on a route card (when not in selection mode) to open the detailed route drawer
- The drawer slides up from the bottom with two main tabs:
  - **Overview Tab**: Shows comprehensive route summary including total stops, passenger count, time and distance metrics, and schedule information. Click "View Route Map" to see the route plotted on an interactive map.
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
- Items per page can be adjusted in the "View Options" menu (6, 9, or 12 items per page)

#### 3.3.2 Creating Routes
Use the route creation tools to build new routes from scratch. The process guides you through selecting parameters and assigning employees step by step.

**Starting the Creation Process:**
- Click on the "Create Route" tab in the Route Management area
- The system will guide you through a step-by-step process to build your route

**Step 1: Select a Shift**
- Choose from the available work shifts in your organization
- The system will show you the time range for each shift (start and end times)
- Selecting a shift determines which employees are available for assignment

**Step 2: Choose a Location (Optional)**
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
- Click "Preview Route" to see the complete route on an interactive map
- The preview shows:
  - Pickup sequence for all employees
  - Total distance and estimated travel time
  - Route path visualization
  - Any potential issues or optimizations

**Step 8: Finalize and Save**
- Enter a descriptive name for the route (or use the system's suggestion)
- Review all route details one final time
- Click "Create Route" to save and activate the route
- The system confirms successful creation and returns you to the management view

**Important Notes:**
- Routes should not exceed 90 minutes total travel time
- The system automatically calculates optimal pickup sequences
- You can modify routes after creation using the management view

#### 3.3.3 Route Assignment
Use the assignment tools to place remaining unassigned employees on existing routes that have available capacity.

**Accessing the Assignment View:**
- Click on the "Assignment" tab in the Route Management area
- This view focuses specifically on filling empty seats on existing routes

**Step 1: Select a Shift**
- Choose the shift you want to work with from the dropdown
- The system will show shift timing information for reference
- This determines which employees and routes are available for assignment

**Step 2: Review Unassigned Employees**
- The system displays all employees in the selected shift who don't have route assignments
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
- You can see detailed information about the route's current passengers and capacity

**Step 5: Assign Employees**
- Click the "Assign" button to open the assignment modal
- Review the route details and current metrics
- Select employees from the unassigned list
- The system shows how adding each employee will affect total travel time and distance

**Step 6: Confirm the Assignment**
- Review the updated route metrics after adding the employee
- Confirm that the new total time stays within acceptable limits (under 90 minutes)
- Click "Confirm" to complete the assignment

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
- `Create_Organization_Page.png` and `Sign_Up.png` walk through the tenant creation wizard from initial profile to confirmation.
- `Orgamization_Management_Overview.png` shows the landing view you should validate before releasing access.
- Document the assigned operations contact and confirm MFA is enforced before closing the onboarding ticket.



### 4.3 Managing Workforce Coverage [Manager]
Fleet Managers and staffing leads use the employee panels to balance shifts and respond to live staffing gaps.
- `Employee_List.png`, `Department_List.png`, and `Shift_Management.png` provide the quickest path to confirm headcount, specialties, and shift coverage before each scheduling cycle.
- The add forms (`Add_Single_Employee.png`, `Add_Single_Employee2.png`, `Add_Single_Employee_Enter_Location.png`) gather personal details, home bases, and certifications. Use them when onboarding a new hire or transferring someone between depots.
- Department and shift forms (`Add_New_Department.png`, `Add_New_Shift.png`) help you capture organizational changes once HR approves them. Align these entries with the paper rosters to avoid confusion on the floor.

### 4.4 Maintaining the Shuttle Fleet [Manager]
Fleet Managers monitor capacity, maintenance windows, and accessibility commitments inside the shuttle workspace.
- `Shuttle_Management/18.png`, `19.png`, and `20.png` demonstrate the list, detail, and edit flows used for daily audits.
- When a shuttle returns from maintenance, confirm its seating and accessibility fields match the mechanic's release paperwork. The routing tools will block assignments that exceed the capacity recorded here.
- Note upcoming inspections or downtime inside the detail view so dispatchers see the warning before planning routes.

### 4.5 Briefing Drivers on Assignments [Driver & Manager]
Drivers generally receive read-only accounts or rely on dispatcher briefings. Use these steps to keep the field team aligned.
1. After assignments are finalized, dispatchers open the **Manage** tab, filter by shift, and capture the relevant drawer view (`RouteManagement_Grid_CheckingROuteDetails.png`).
2. Share the passenger list, stop order, and start time with the driver—either by exporting the view or reviewing it together before departure.
3. Drivers with portal access can sign in, open **Routes → Manage**, and view the same drawer to confirm details just before boarding.
4. Remind drivers to report any variance (late passengers, road closures, safety issues) through the escalation channel listed in Section 5.2.

## 5. Staying Informed and Supported
Company administrators maintain locations, invite members, and ensure access stays current.
- `Adding_New_Organization_Location.png` captures the location form used for depots and hubs. Update this whenever a site opens, closes, or changes capacity.
- `Adding_Organization_Member.png` and `Organization_Members.png` illustrate how to add, suspend, or elevate members. Review the roster weekly so departed staff no longer hold accounts.
- Keep a short log of changes so compliance and Super Admin teams can audit activity quickly.

### 4.3 Managing Workforce Coverage [Manager]
Fleet Managers and staffing leads use the employee panels to balance shifts and respond to live staffing gaps.
- `Employee_List.png`, `Department_List.png`, and `Shift_Management.png` provide the quickest path to confirm headcount, specialties, and shift coverage before each scheduling cycle.
- The add forms (`Add_Single_Employee.png`, `Add_Single_Employee2.png`, `Add_Single_Employee_Enter_Location.png`) gather personal details, home bases, and certifications. Use them when onboarding a new hire or transferring someone between depots.
- Department and shift forms (`Add_New_Department.png`, `Add_New_Shift.png`) help you capture organizational changes once HR approves them. Align these entries with the paper rosters to avoid confusion on the floor.

### 4.4 Maintaining the Shuttle Fleet [Manager]
Fleet Managers monitor capacity, maintenance windows, and accessibility commitments inside the shuttle workspace.
- `Shuttle_Management/18.png`, `19.png`, and `20.png` demonstrate the list, detail, and edit flows used for daily audits.
- When a shuttle returns from maintenance, confirm its seating and accessibility fields match the mechanic’s release paperwork. The routing tools will block assignments that exceed the capacity recorded here.
- Note upcoming inspections or downtime inside the detail view so dispatchers see the warning before planning routes.

### 4.5 Briefing Drivers on Assignments [Driver & Manager]
Drivers generally receive read-only accounts or rely on dispatcher briefings. Use these steps to keep the field team aligned.
1. After assignments are finalized, dispatchers open the **Manage** tab, filter by shift, and capture the relevant drawer view (`RouteManagement_Grid_CheckingROuteDetails.png`).
2. Share the passenger list, stop order, and start time with the driver—either by exporting the view or reviewing it together before departure.
3. Drivers with portal access can sign in, open **Routes → Manage**, and view the same drawer to confirm details just before boarding.
4. Remind drivers to report any variance (late passengers, road closures, safety issues) through the escalation channel listed in Section 5.2.

## 5. Staying Informed and Supported
Keep these references close when questions or issues arise.

### 5.1 Using Notifications, Audit Trail, and Help
- Notifications appear beside the page header and reflect server-side audit events.
- The help icon opens contextual documentation. Inline tooltips surface policy reminders, such as the 90-minute route limit.

### 5.2 Handling Errors and Getting Support

#### 5.2.1 Understanding Inline and Toast Messages
- Missing fields: red outlines with helper text indicating what still needs attention.
- Capacity conflicts: toast message “Route has reached maximum vehicle capacity.”
- Unauthorized actions: the portal redirects to the login or unauthorized page depending on your session status.

#### 5.2.2 Reporting Issues
1. Note the exact error message and time.
2. Capture the relevant UI (use the filenames above when embedding in reports).
3. File a help desk ticket and include any reference code displayed in the alert. If no code appears, list the route name, shift, and vehicle involved.
4. For urgent routing disruptions, escalate through `#fleet-support` with the recorded details.

## 6. Reference

### 6.1 Glossary
- **Cluster Recommendation**: Employee grouping suggested by the optimizer service to minimize travel time.
- **Route Preview**: Interactive map, distance, and time estimate generated before a route is saved.
- **Assignment Modal**: Window that lets dispatchers adjust employee placements while seeing live travel metrics.

### 6.2 Revision Log
| Version | Date       | Author              | Notes                                   |
| ------- | ---------- | ------------------- | --------------------------------------- |
| 1.1     | 2025-01-15 | Documentation Team  | Updated Section 3 to match current UI - clarified Home vs Dashboard, updated Route Management description |
| 1.0     | 2025-10-03 | Documentation Team  | Initial UI-driven draft for Annex usage |

---

**Reminder:** Replace each screenshot reference with the corresponding asset from `docs/project main docs/User Manual/` during final document assembly.