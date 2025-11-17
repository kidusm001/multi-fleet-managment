# Employee Management

## Overview
This section covers employee administration for Manager and Admin roles.

## Roles
- Manager: View and manage employee assignments and status.
- Admin: Full employee management, including activating/deactivating employees.

## Features
- Employee list with filtering by department, shift, status, and assignment.
- Pagination and sorting for large lists.
- Activate/deactivate employees (Admin only).
- Stats: total employees, active employees, and top locations.

## Technical Notes
- Uses `/employees/management` for management view including inactive employees.
- Departments and shifts populated from `/departments` and `/shifts`.
- UI built with shadcn/ui components and Tailwind.

## Future Enhancements
1. Bulk edit employees
2. Advanced search and saved filters
3. Export employees to CSV