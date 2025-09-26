import json
import math
import numpy as np
from haversine import haversine
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

EARTH_RADIUS_KM = 6371.0

def calculate_bearing(pointA, pointB):
    """
    Calculates the bearing from pointA to pointB with enhanced precision.

    Args:
        pointA (List[float]): [latitude, longitude] of the first point.
        pointB (List[float]): [latitude, longitude] of the second point.

    Returns:
        float: Bearing in degrees from pointA to pointB.
    """
    lat1, lon1 = math.radians(pointA[0]), math.radians(pointA[1])
    lat2, lon2 = math.radians(pointB[0]), math.radians(pointB[1])
    dLon = lon2 - lon1

    y = math.sin(dLon) * math.cos(lat2)
    x = (math.cos(lat1) * math.sin(lat2) - 
         math.sin(lat1) * math.cos(lat2) * math.cos(dLon))

    initial_bearing = math.atan2(y, x)
    compass_bearing = (math.degrees(initial_bearing) + 360) % 360

    return compass_bearing

def calculate_distance_and_bearing_matrix(locations):
    coords = np.radians(np.array(locations))  # shape (N, 2)
    lat = coords[:, 0]
    lon = coords[:, 1]

    # Precompute sines & cosines
    sin_lat = np.sin(lat)
    cos_lat = np.cos(lat)

    # Create broadcastable grids
    lat1 = lat[:, np.newaxis]
    lon1 = lon[:, np.newaxis]
    lat2 = lat[np.newaxis, :]
    lon2 = lon[np.newaxis, :]
    sin_lat1 = sin_lat[:, np.newaxis]
    cos_lat1 = cos_lat[:, np.newaxis]
    sin_lat2 = sin_lat[np.newaxis, :]
    cos_lat2 = cos_lat[np.newaxis, :]

    # Compute differences
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    # Haversine distance
    a = (np.sin(dlat / 2)**2
         + cos_lat1 * cos_lat2 * np.sin(dlon / 2)**2)
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    distance_matrix = EARTH_RADIUS_KM * c

    # Bearing
    x = np.sin(dlon) * cos_lat2
    y = (cos_lat1 * sin_lat2 - sin_lat1 * cos_lat2 * np.cos(dlon))
    initial_bearing = np.arctan2(x, y)
    initial_bearing_deg = np.degrees(initial_bearing)
    bearing_matrix = (initial_bearing_deg + 360.0) % 360.0

    # Optionally zero out diagonals
    np.fill_diagonal(distance_matrix, 0.0)
    np.fill_diagonal(bearing_matrix, 0.0)

    return distance_matrix.tolist(), bearing_matrix.tolist()

def assign_employees_to_shuttles(locations, distance_matrix, bearing_matrix, shuttle_capacities):
    num_locations = len(locations)
    num_shuttles = len(shuttle_capacities)

    # Create the routing index manager
    manager = pywrapcp.RoutingIndexManager(num_locations, num_shuttles, 0)

    # Create the routing model
    routing = pywrapcp.RoutingModel(manager)

    # Define the custom cost callback incorporating distance and bearing change
    def combined_cost_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        distance = distance_matrix[from_node][to_node]
        
        # Enhanced bearing penalty calculation
        bearing = bearing_matrix[from_node][to_node]
        prev_bearing = 0
        
        if from_node != 0:
            for i in range(num_locations):
                if routing.IsStart(manager.NodeToIndex(i)):
                    prev_bearing = bearing_matrix[i][from_node]
                    break
        
        # Calculate bearing change with improved precision
        bearing_change = min((bearing - prev_bearing) % 360, 
                           (prev_bearing - bearing) % 360)
        
        # Enhanced penalty factors
        distance_factor = 1.2 if distance > 3 else 1.0  # Encourage closer stops
        bearing_penalty = (bearing_change / 180.0) * distance * 0.8
        
        # Additional penalties for extreme cases
        if bearing_change > 120:  # Discourage sharp turns
            bearing_penalty *= 1.5
        if distance > 5:  # Discourage very long distances
            distance_factor *= 1.3
            
        # Return combined cost with weighted factors
        base_cost = distance * distance_factor * 1000
        total_cost = int(base_cost + bearing_penalty * 800)
        
        return total_cost

    combined_transit_callback_index = routing.RegisterTransitCallback(combined_cost_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(combined_transit_callback_index)

    # Add capacity constraints
    demand = [0] + [1] * (num_locations - 1)  # HQ has no demand

    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demand[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # No slack
        shuttle_capacities,
        True,  # Start cumul to zero
        "Capacity"
    )

    # Enhanced search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(30)
    search_parameters.solution_limit = 500  # Keep the 500 limit
    
    # Add these parameters for better optimization
    search_parameters.log_search = True
    search_parameters.use_full_propagation = True
    search_parameters.guided_local_search_lambda_coefficient = 0.5

    solution = routing.SolveWithParameters(search_parameters)

    # Extract the routes
    if solution:
        routes = []
        for vehicle_id in range(num_shuttles):
            index = routing.Start(vehicle_id)
            route = []
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                route.append(node)
                index = solution.Value(routing.NextVar(index))
            routes.append(route)
        return routes
    else:
        return None

def verify_unique_assignments(routes, num_employees):
    """
    Verifies that each employee is uniquely assigned to exactly one shuttle.

    Args:
        routes (List[List[int]]): The list of routes for each shuttle.
        num_employees (int): The total number of employees.

    Returns:
        bool: True if all employees are uniquely assigned, False otherwise.
    """
    assigned_employees = []
    for shuttle_id, route in enumerate(routes, start=1):
        # Exclude the HQ (node 0) from assignment
        employee_nodes = route[1:]
        assigned_employees.extend(employee_nodes)
        print(f"Shuttle {shuttle_id} assigned employees: {employee_nodes}")

    # Check for duplicates
    duplicates = set([x for x in assigned_employees if assigned_employees.count(x) > 1])
    if duplicates:
        print(f"Duplicate assignments found for employees: {duplicates}")
        return False

    # Check for missing assignments
    expected_employees = set(range(1, num_employees + 1))
    assigned_set = set(assigned_employees)
    missing = expected_employees - assigned_set
    if missing:
        print(f"Missing assignments for employees: {missing}")
        return False

    print("All employees are uniquely assigned to shuttles.")
    return True

def main():
    # Remove the local JSON loading and saving calls
    pass

if __name__ == "__main__":
    main()
