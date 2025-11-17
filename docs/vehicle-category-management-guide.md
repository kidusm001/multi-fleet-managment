# Vehicle Category Management - User Guide

## Overview
The Vehicle Category Management feature allows you to create and manage different types of vehicles in your fleet. Categories define vehicle types (e.g., Standard Van, Mini Bus, Large Coach) and their passenger capacities.

## Accessing Vehicle Categories

1. Navigate to **Settings** from the main menu
2. Click on the **Categories** tab
3. You'll see the Vehicle Category Management interface

## Features

### Dashboard Overview
The category dashboard displays:
- **Total Categories**: Number of vehicle types in your organization
- **Average Capacity**: Average seating capacity across all categories
- **Total Capacity**: Combined seating capacity of all categories

### Creating a New Category

1. Click the **"Add Category"** button in the top right
2. Fill in the form:
   - **Category Name**: Name of the vehicle type (e.g., "Standard Van", "Mini Bus")
   - **Capacity**: Number of passenger seats (1-100)
3. Click **"Create Category"** to save

#### Validation Rules
- Category name must be at least 2 characters
- Category name must be unique within your organization
- Capacity must be a positive whole number between 1 and 100

### Editing a Category

1. Find the category in the table
2. Click the **Edit** (pencil) icon
3. Update the information
4. Click **"Update Category"** to save changes

### Deleting a Category

1. Find the category in the table
2. Click the **Delete** (trash) icon
3. Confirm the deletion

**Important**: Categories can only be deleted if:
- No vehicles are assigned to this category
- No pending vehicle requests use this category

If deletion fails, you'll receive an error message explaining which vehicles or requests are blocking the deletion.

### Searching Categories

Use the search bar at the top of the table to filter categories by name in real-time.

## API Integration

The feature uses the following API endpoints:

### Organization-Scoped Endpoints
- `GET /api/vehicle-categories` - List all categories
- `GET /api/vehicle-categories/:id` - Get specific category
- `POST /api/vehicle-categories` - Create new category
- `PUT /api/vehicle-categories/:id` - Update category
- `DELETE /api/vehicle-categories/:id` - Delete category

### Required Permissions
- **Read**: `vehicleCategory.read`
- **Create**: `vehicleCategory.create`
- **Update**: `vehicleCategory.update`
- **Delete**: `vehicleCategory.delete`

## Common Use Cases

### Setting Up Initial Fleet
1. Create categories for your vehicle types:
   - "Standard Van" (14 seats)
   - "Mini Bus" (22 seats)
   - "Large Coach" (45 seats)
2. Use these categories when adding vehicles to your fleet

### Managing Capacity
- View total capacity across all categories
- Identify vehicle types with highest/lowest capacity
- Plan fleet expansion based on category distribution

### Organizing Vehicle Requests
- Categories are used when requesting new vehicles
- Fleet managers can specify which type of vehicle they need
- Administrators can see what types of vehicles are being requested

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Category name already exists" | Duplicate name in organization | Choose a different name |
| "Cannot delete category with associated vehicles" | Category is in use | Remove vehicles from category first |
| "Capacity must be a positive number" | Invalid capacity value | Enter a number between 1-100 |
| "Category name is required" | Empty name field | Enter a category name |

## Best Practices

1. **Use descriptive names**: Name categories clearly (e.g., "12-Seater Van" vs "Van A")
2. **Standard capacities**: Use actual seating capacity for accurate route planning
3. **Avoid deletion**: If a category is in use, consider keeping it for historical data
4. **Regular review**: Periodically review categories to ensure they match your fleet

## Related Features

- **Vehicle Management**: Assign vehicles to categories
- **Vehicle Requests**: Request vehicles by category
- **Route Planning**: Routes automatically consider vehicle capacity
- **Fleet Analytics**: View statistics by vehicle category

## Technical Notes

### Service Layer
The feature uses `vehicleCategoryService.js` which provides:
- Automatic data validation
- Error handling
- API communication
- Response formatting

### Components
- **VehicleCategoryManagement**: Main container
- **CategoriesTable**: Table display
- **CategoryFormDialog**: Create/edit form
- **CategoryDeleteDialog**: Delete confirmation

### State Management
- Local state for form data
- Real-time search filtering
- Optimistic UI updates
- Error boundary handling

## Support

For issues or questions:
1. Check error messages for specific guidance
2. Verify you have the required permissions
3. Contact your system administrator
4. Refer to the API documentation at `/docs/api/vehicle-categories.md`
