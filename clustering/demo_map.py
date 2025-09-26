import requests
import json
import folium

BASE_URL = "http://localhost:8000"

test_data_1 = {"locations":{"HQ":[9.0222,38.7468],"employees":[{"id":"c8a73881-56cc-4a73-a52c-b0fd2ef6d04e","latitude":9.03287202200085,"longitude":38.76343705089629},{"id":"15cf3b4f-aaed-44d3-bd4d-0375a5a1af77","latitude":9.04293879926999,"longitude":38.76907066992139},{"id":"41ffa805-7b34-42ac-9418-891563aaa175","latitude":9.03369509386297,"longitude":38.75478508606945},{"id":"aaef05ed-cec8-4b0a-a9d1-ec688e4d7df6","latitude":9.012204294628887,"longitude":38.74679027085802},{"id":"4de64863-fe56-4190-9d13-5e9254edba11","latitude":9.044270542583565,"longitude":38.76023426541653},{"id":"91b4aad9-a30f-4f79-bd48-62060eb1c05b","latitude":9.03457270903528,"longitude":38.84610715018231},{"id":"53db866e-e554-43c2-a5c3-f312b6a03778","latitude":9.034572932288537,"longitude":38.84613217184764},{"id":"7f1d424b-da16-45c6-be8b-6075c71b95d5","latitude":9.046267720531768,"longitude":38.88009541881031},{"id":"0f40778a-61f0-49ea-9aff-362294e3d429","latitude":9.017882290414272,"longitude":38.79562470479321},{"id":"d9621528-9038-42ce-81fd-077bbda6f6eb","latitude":9.010779787674236,"longitude":38.89456335992595},{"id":"83359cd9-c476-4c2f-a7ba-ec05f86d612b","latitude":9.028523332591963,"longitude":38.87593296009408},{"id":"04a7ed4e-76d2-4b31-9db8-795d3348c901","latitude":9.001489969659858,"longitude":38.7819725340372},{"id":"4db8852f-1513-400e-8e58-4337e878a8d1","latitude":8.986746249254816,"longitude":38.79336889463149},{"id":"57960072-ecc4-4e48-9c86-3fa9f6c17227","latitude":8.967152184362995,"longitude":38.78025356978782},{"id":"95872ef3-aa24-4afe-916e-fd4056515616","latitude":9.002833836117155,"longitude":38.79971092620778},{"id":"0f52c71f-087e-42b7-935c-5f2eb047625c","latitude":8.987472802464548,"longitude":38.7973012408324},{"id":"81f3370c-71b8-4dc6-9995-0f26749a3fdd","latitude":8.98311777237035,"longitude":38.77275682326565},{"id":"0d5a7230-4857-4483-b861-bf4abd3e8b26","latitude":9.002150369296826,"longitude":38.8423026262783},{"id":"5cef5f61-47bf-4709-ae65-f73db238df7a","latitude":9.059905443974783,"longitude":38.78734247206368},{"id":"7c27a23f-61ee-4a7c-8e7f-81dcb0b130ca","latitude":9.042873786750272,"longitude":38.76917973308376},{"id":"f6b60409-fdfe-4006-bcb2-6b4369da62aa","latitude":9.00149837352932,"longitude":38.78199238373926},{"id":"3759680a-00e4-4917-b63d-eaf8fbee002b","latitude":9.002982911271694,"longitude":38.79954123873755},{"id":"80116ba1-3f86-4631-a5f9-7f2e7a8dc552","latitude":8.987445196580085,"longitude":38.79727875809574},{"id":"29d6adf1-6c17-4d4b-a759-6d2f4da38ecd","latitude":8.983138645898839,"longitude":38.77279596649354},{"id":"5f89c16c-2e86-4c19-92d8-e5ccc55f83de","latitude":8.987745877645528,"longitude":38.78461777996745},{"id":"9c06ba79-316f-4fd1-a371-a4843dbab330","latitude":8.99533589976133,"longitude":38.80939259051409},{"id":"502f8ad3-074b-4384-86ce-85e9389c9d09","latitude":8.9969024466439,"longitude":38.83213045826451},{"id":"5b38fd31-50de-42c5-99b4-c6a2f7931dc8","latitude":9.014863284775599,"longitude":38.78388562634067},{"id":"215c5c49-e490-4256-a345-aeb58191349d","latitude":9.019676093765247,"longitude":38.80175503224659}]},"shuttles":[{"id":3,"capacity":6},{"id":2,"capacity":6},{"id":4,"capacity":4},{"id":5,"capacity":4},{"id":6,"capacity":4},{"id":7,"capacity":7},{"id":8,"capacity":7},{"id":9,"capacity":4},{"id":10,"capacity":4},{"id":11,"capacity":25},{"id":13,"capacity":7}]}

def get_routes():
    """
    Fetches routes from the clustering API.
    """
    headers = {"Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/clustering", data=json.dumps(test_data_1), headers=headers)
    response.raise_for_status()
    return response.json()

def create_map(response_data, locations_data):
    """
    Creates a folium map with the routes.
    """
    hq_location = locations_data["locations"]["HQ"]
    employee_locations = {emp["id"]: [emp["latitude"], emp["longitude"]] for emp in locations_data["locations"]["employees"]}

    # Create a map centered at the HQ
    m = folium.Map(location=hq_location, zoom_start=13)

    # Add a marker for the HQ
    folium.Marker(
        location=hq_location,
        popup="HQ",
        icon=folium.Icon(color="red", icon="info-sign"),
    ).add_to(m)

    # Add markers for all employees
    for emp_id, emp_loc in employee_locations.items():
        folium.Marker(
            location=emp_loc,
            popup=f"Employee {emp_id}",
            icon=folium.Icon(color="blue"),
        ).add_to(m)

    # Define a list of colors for the routes
    route_colors = ["green", "purple", "orange", "darkred", "lightred", "beige", "darkblue", "darkgreen", "cadetblue", "darkpurple", "white", "pink", "lightblue", "lightgreen", "gray", "black", "lightgray"]

    # Draw the routes
    for i, route in enumerate(response_data["routes"]):
        shuttle_id = route["shuttle_id"]
        employee_ids = route["employees"]
        
        if not employee_ids:
            continue

        # Get the coordinates for the route, including the return to HQ
        route_coordinates = [hq_location] + [employee_locations[emp_id] for emp_id in employee_ids] + [hq_location]
        
        # Add a line for the route
        folium.PolyLine(
            locations=route_coordinates,
            color=route_colors[i % len(route_colors)],
            weight=2.5,
            opacity=1,
            popup=f"Shuttle {shuttle_id}"
        ).add_to(m)

    return m

if __name__ == "__main__":
    try:
        # Start the FastAPI server in the background first
        # uvicorn src.main:app --reload
        
        # Get the routes from the API
        api_response = get_routes()
        print("API Response:")
        print(json.dumps(api_response, indent=2))
        
        # Create and save the map
        route_map = create_map(api_response, test_data_1)
        route_map.save("route_map.html")
        print("Map saved to route_map.html")

    except requests.exceptions.RequestException as e:
        print(f"Error calling the API: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
