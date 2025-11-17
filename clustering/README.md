# Shuttle Route Optimization System

Anntelligent routing system that optimizes shuttle routes for employee pickup and drop-off services. The system uses advanced algorithms to calculate the most efficient routes while considering vehicle capacities, geographic distances, and directional optimization.

## Features
- 🚐 Optimizes routes for multiple shuttles simultaneously
- 📍 Handles real-world geographic coordinates
- ⚖️ Respects vehicle capacity constraints
- 🧭 Considers bearing/direction for route smoothness
- 🔄 Ensures all employees are assigned exactly once
- 🌐 RESTful API interface
- ✅ Built-in route verification

## Technology Stack
- Python 3.x
- Google OR-Tools for route optimization
- FastAPI for REST API
- Haversine formula for geographic calculations
- JSON for data storage and API communication

## Algorithm Overview

The core of the system is a sophisticated optimization algorithm that balances distance and route directness.

1.  **Distance and Bearing Calculation**:
    *   The system calculates the haversine distance between all pairs of locations (HQ and employees) to get accurate real-world distances.
    *   It also calculates the bearing (direction) between points. This is used to penalize sharp turns, leading to smoother and more efficient routes.

2.  **Cost Function**:
    *   A combined cost function is used for optimization. It's a weighted sum of the travel distance and a penalty for changing direction. This ensures that the solver doesn't just find the shortest path, but also a practical one.

3.  **Route Optimization**:
    *   The problem is modeled as a Vehicle Routing Problem (VRP).
    *   Google OR-Tools is used to solve the VRP.
    *   The solver first finds an initial solution using a `PATH_CHEAPEST_ARC` strategy and then improves upon it using a `GUIDED_LOCAL_SEARCH` metaheuristic.
    *   Shuttle capacity constraints are strictly enforced.

4.  **Verification**:
    *   After a solution is found, it is verified to ensure that every employee is assigned to exactly one shuttle and that no shuttle's capacity is exceeded.

## API Endpoints

The service is exposed via a RESTful API.

### `POST /clustering`

This is the main endpoint for assigning routes.

**Request Body:**

```json
{
  "locations": {
    "HQ": [
      -1.286389,
      36.817223
    ],
    "employees": [
      {
        "id": "emp1",
        "latitude": -1.292066,
        "longitude": 36.821945
      }
    ]
  },
  "shuttles": [
    {
      "id": 1,
      "capacity": 10
    }
  ]
}
```

**Response Body (Success):**

```json
{
  "success": true,
  "routes": [
    {
      "shuttle_id": 1,
      "employees": [
        "emp1"
      ]
    }
  ],
  "verification_passed": true
}
```

### `GET /health`

A simple health check endpoint.

**Response Body:**

```json
{
  "status": "ok",
  "service": "route-assignment"
}
```

## Security Note

To prevent direct access to FastAPI endpoints, ensure that FastAPI is bound only to localhost. For example, when starting FastAPI with uvicorn, use:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

Alternatively, configure your firewall to restrict external access.


