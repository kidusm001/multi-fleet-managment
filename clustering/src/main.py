from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from . import assign_routes  
import asyncio

app = FastAPI()

# Store the current task
current_task = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Employee(BaseModel):
    id: str
    latitude: float
    longitude: float

class Shuttle(BaseModel):
    id: str
    capacity: int

class LocationData(BaseModel):
    HQ: List[float]
    employees: List[Employee]

class RouteRequest(BaseModel):
    locations: LocationData
    shuttles: List[Shuttle]

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "route-assignment"}

@app.post("/clustering")
async def assign_routes_endpoint(request: RouteRequest, background_tasks: BackgroundTasks):
    global current_task
    
    # Cancel current task if exists
    if current_task and not current_task.done():
        current_task.cancel()
        try:
            await current_task
        except asyncio.CancelledError:
            pass

    try:
        # Create new task
        async def process_request():
            # Validate input data
            if not request.shuttles:
                return {
                    "success": False,
                    "message": "At least one shuttle is required for clustering",
                    "routes": []
                }
            
            if not request.locations.employees:
                return {
                    "success": True,
                    "message": "No employees to assign",
                    "routes": []
                }
            
            # Prepare locations list with HQ first, then employees
            hq = request.locations.HQ
            employees = request.locations.employees
            locations = [hq] + [[emp.latitude, emp.longitude] for emp in employees]
            
            # Extract employee IDs in order (excluding HQ)
            employee_ids = [emp.id for emp in employees]
            
            # Extract shuttle capacities
            shuttle_capacities = [shuttle.capacity for shuttle in request.shuttles]
            
            # Calculate matrices
            distance_matrix, bearing_matrix = assign_routes.calculate_distance_and_bearing_matrix(locations)
            
            # Assign routes
            routes = assign_routes.assign_employees_to_shuttles(
                locations, 
                distance_matrix, 
                bearing_matrix, 
                shuttle_capacities
            )
            
            if not routes:
                raise HTTPException(status_code=400, detail="No solution found")
            
            # Verify assignments
            num_employees = len(employee_ids)
            verification_passed = assign_routes.verify_unique_assignments(routes, num_employees)
            
            # Map routes to employee IDs
            assigned_routes = []
            for shuttle_id, route in enumerate(routes, start=0):
                # Exclude the HQ (node 0) from assignment
                employee_indices = route[1:]
                assigned_employees = [employee_ids[idx - 1] for idx in employee_indices]
                assigned_routes.append({
                    "shuttle_id": request.shuttles[shuttle_id].id,
                    "employees": assigned_employees
                })
            
            return {
                "success": True,
                "routes": assigned_routes,
                "verification_passed": verification_passed,
                "total_demand": num_employees,
                "total_capacity": sum(shuttle_capacities)
            }

        # Set and run the new task
        current_task = asyncio.create_task(process_request())
        result = await current_task
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Route Assignment API is running"}