import requests
import json

BASE_URL = "http://localhost:8000"

def test_assign_routes_1():
    """
    Test the /clustering endpoint with the first dataset.
    """
    test_data_1 = {"locations":{"HQ":[9.0222,38.7468],"employees":[{"id":"c8a73881-56cc-4a73-a52c-b0fd2ef6d04e","latitude":9.03287202200085,"longitude":38.76343705089629},{"id":"15cf3b4f-aaed-44d3-bd4d-0375a5a1af77","latitude":9.04293879926999,"longitude":38.76907066992139},{"id":"41ffa805-7b34-42ac-9418-891563aaa175","latitude":9.03369509386297,"longitude":38.75478508606945},{"id":"aaef05ed-cec8-4b0a-a9d1-ec688e4d7df6","latitude":9.012204294628887,"longitude":38.74679027085802},{"id":"4de64863-fe56-4190-9d13-5e9254edba11","latitude":9.044270542583565,"longitude":38.76023426541653},{"id":"91b4aad9-a30f-4f79-bd48-62060eb1c05b","latitude":9.03457270903528,"longitude":38.84610715018231},{"id":"53db866e-e554-43c2-a5c3-f312b6a03778","latitude":9.034572932288537,"longitude":38.84613217184764},{"id":"7f1d424b-da16-45c6-be8b-6075c71b95d5","latitude":9.046267720531768,"longitude":38.88009541881031},{"id":"0f40778a-61f0-49ea-9aff-362294e3d429","latitude":9.017882290414272,"longitude":38.79562470479321},{"id":"d9621528-9038-42ce-81fd-077bbda6f6eb","latitude":9.010779787674236,"longitude":38.89456335992595},{"id":"83359cd9-c476-4c2f-a7ba-ec05f86d612b","latitude":9.028523332591963,"longitude":38.87593296009408},{"id":"04a7ed4e-76d2-4b31-9db8-795d3348c901","latitude":9.001489969659858,"longitude":38.7819725340372},{"id":"4db8852f-1513-400e-8e58-4337e878a8d1","latitude":8.986746249254816,"longitude":38.79336889463149},{"id":"57960072-ecc4-4e48-9c86-3fa9f6c17227","latitude":8.967152184362995,"longitude":38.78025356978782},{"id":"95872ef3-aa24-4afe-916e-fd4056515616","latitude":9.002833836117155,"longitude":38.79971092620778},{"id":"0f52c71f-087e-42b7-935c-5f2eb047625c","latitude":8.987472802464548,"longitude":38.7973012408324},{"id":"81f3370c-71b8-4dc6-9995-0f26749a3fdd","latitude":8.98311777237035,"longitude":38.77275682326565},{"id":"0d5a7230-4857-4483-b861-bf4abd3e8b26","latitude":9.002150369296826,"longitude":38.8423026262783},{"id":"5cef5f61-47bf-4709-ae65-f73db238df7a","latitude":9.059905443974783,"longitude":38.78734247206368},{"id":"7c27a23f-61ee-4a7c-8e7f-81dcb0b130ca","latitude":9.042873786750272,"longitude":38.76917973308376},{"id":"f6b60409-fdfe-4006-bcb2-6b4369da62aa","latitude":9.00149837352932,"longitude":38.78199238373926},{"id":"3759680a-00e4-4917-b63d-eaf8fbee002b","latitude":9.002982911271694,"longitude":38.79954123873755},{"id":"80116ba1-3f86-4631-a5f9-7f2e7a8dc552","latitude":8.987445196580085,"longitude":38.79727875809574},{"id":"29d6adf1-6c17-4d4b-a759-6d2f4da38ecd","latitude":8.983138645898839,"longitude":38.77279596649354},{"id":"5f89c16c-2e86-4c19-92d8-e5ccc55f83de","latitude":8.987745877645528,"longitude":38.78461777996745},{"id":"9c06ba79-316f-4fd1-a371-a4843dbab330","latitude":8.99533589976133,"longitude":38.80939259051409},{"id":"502f8ad3-074b-4384-86ce-85e9389c9d09","latitude":8.9969024466439,"longitude":38.83213045826451},{"id":"5b38fd31-50de-42c5-99b4-c6a2f7931dc8","latitude":9.014863284775599,"longitude":38.78388562634067},{"id":"215c5c49-e490-4256-a345-aeb58191349d","latitude":9.019676093765247,"longitude":38.80175503224659}]},"shuttles":[{"id":3,"capacity":6},{"id":2,"capacity":6},{"id":4,"capacity":4},{"id":5,"capacity":4},{"id":6,"capacity":4},{"id":7,"capacity":7},{"id":8,"capacity":7},{"id":9,"capacity":4},{"id":10,"capacity":4},{"id":11,"capacity":25},{"id":13,"capacity":7}]}
    headers = {"Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/clustering", data=json.dumps(test_data_1), headers=headers)
    
    assert response.status_code == 200
    
    response_data = response.json()
    print(json.dumps(response_data))
    
    assert "routes" in response_data
    assert isinstance(response_data["routes"], list)
    
    assert len(response_data["routes"]) <= len(test_data_1["shuttles"])

def test_assign_routes_2():
    """
    Test the /clustering endpoint with the second dataset.
    """
    test_data_2 = {"locations":{"HQ":[9.0222,38.7468],"employees":[{"id":"c8a73881-56cc-4a73-a52c-b0fd2ef6d04e","latitude":9.03287202200085,"longitude":38.76343705089629},{"id":"15cf3b4f-aaed-44d3-bd4d-0375a5a1af77","latitude":9.04293879926999,"longitude":38.76907066992139},{"id":"41ffa805-7b34-42ac-9418-891563aaa175","latitude":9.03369509386297,"longitude":38.75478508606945},{"id":"aaef05ed-cec8-4b0a-a9d1-ec688e4d7df6","latitude":9.012204294628887,"longitude":38.74679027085802},{"id":"4de64863-fe56-4190-9d13-5e9254edba11","latitude":9.044270542583565,"longitude":38.76023426541653},{"id":"91b4aad9-a30f-4f79-bd48-62060eb1c05b","latitude":9.03457270903528,"longitude":38.84610715018231},{"id":"53db866e-e554-43c2-a5c3-f312b6a03778","latitude":9.034572932288537,"longitude":38.84613217184764},{"id":"7f1d424b-da16-45c6-be8b-6075c71b95d5","latitude":9.046267720531768,"longitude":38.88009541881031},{"id":"0f40778a-61f0-49ea-9aff-362294e3d429","latitude":9.017882290414272,"longitude":38.79562470479321},{"id":"d9621528-9038-42ce-81fd-077bbda6f6eb","latitude":9.010779787674236,"longitude":38.89456335992595},{"id":"83359cd9-c476-4c2f-a7ba-ec05f86d612b","latitude":9.028523332591963,"longitude":38.87593296009408},{"id":"04a7ed4e-76d2-4b31-9db8-795d3348c901","latitude":9.001489969659858,"longitude":38.7819725340372},{"id":"4db8852f-1513-400e-8e58-4337e878a8d1","latitude":8.986746249254816,"longitude":38.79336889463149},{"id":"57960072-ecc4-4e48-9c86-3fa9f6c17227","latitude":8.967152184362995,"longitude":38.78025356978782},{"id":"95872ef3-aa24-4afe-916e-fd4056515616","latitude":9.002833836117155,"longitude":38.79971092620778},{"id":"0f52c71f-087e-42b7-935c-5f2eb047625c","latitude":8.987472802464548,"longitude":38.7973012408324},{"id":"81f3370c-71b8-4dc6-9995-0f26749a3fdd","latitude":8.98311777237035,"longitude":38.77275682326565},{"id":"0d5a7230-4857-4483-b861-bf4abd3e8b26","latitude":9.002150369296826,"longitude":38.8423026262783},{"id":"5cef5f61-47bf-4709-ae65-f73db238df7a","latitude":9.059905443974783,"longitude":38.78734247206368},{"id":"7c27a23f-61ee-4a7c-8e7f-81dcb0b130ca","latitude":9.042873786750272,"longitude":38.76917973308376},{"id":"f6b60409-fdfe-4006-bcb2-6b4369da62aa","latitude":9.00149837352932,"longitude":38.78199238373926},{"id":"3759680a-00e4-4917-b63d-eaf8fbee002b","latitude":9.002982911271694,"longitude":38.79954123873755},{"id":"80116ba1-3f86-4631-a5f9-7f2e7a8dc552","latitude":8.987445196580085,"longitude":38.79727875809574},{"id":"29d6adf1-6c17-4d4b-a759-6d2f4da38ecd","latitude":8.983138645898839,"longitude":38.77279596649354},{"id":"5f89c16c-2e86-4c19-92d8-e5ccc55f83de","latitude":8.987745877645528,"longitude":38.78461777996745},{"id":"9c06ba79-316f-4fd1-a371-a4843dbab330","latitude":8.99533589976133,"longitude":38.80939259051409},{"id":"502f8ad3-074b-4384-86ce-85e9389c9d09","latitude":8.9969024466439,"longitude":38.83213045826451},{"id":"5b38fd31-50de-42c5-99b4-c6a2f7931dc8","latitude":9.014863284775599,"longitude":38.78388562634067},{"id":"215c5c49-e490-4256-a345-aeb58191349d","latitude":9.019676093765247,"longitude":38.80175503224659}]},"shuttles":[{"id":3,"capacity":6},{"id":2,"capacity":6},{"id":4,"capacity":4},{"id":5,"capacity":4},{"id":6,"capacity":4},{"id":7,"capacity":7},{"id":8,"capacity":7},{"id":9,"capacity":4},{"id":10,"capacity":4},{"id":11,"capacity":25},{"id":13,"capacity":7}]}
    headers = {"Content-Type": "application/json"}
    response = requests.post(f"{BASE_URL}/clustering", data=json.dumps(test_data_2), headers=headers)
    
    # Check if the request was successful
    assert response.status_code == 200
    
    # Check the response content
    response_data = response.json()
    print(json.dumps(response_data))
    
    # Add more assertions based on the expected response structure
    assert "routes" in response_data
    assert isinstance(response_data["routes"], list)
    
    # Example: Check if all shuttles are assigned routes
    assert len(response_data["routes"]) <= len(test_data_2["shuttles"])

def test_assign_routes_3():
    """
    Test the /clustering endpoint with a list of datasets.
    """
    test_data_list = [
        {
            "locations": {
            "HQ": [9.0222, 38.7468],
            "employees": [
                {"id": "e1", "latitude": 9.031, "longitude": 38.762},
                {"id": "e2", "latitude": 9.044, "longitude": 38.768},
                {"id": "e3", "latitude": 9.013, "longitude": 38.747},
                {"id": "e4", "latitude": 9.055, "longitude": 38.780},
                {"id": "e5", "latitude": 9.050, "longitude": 38.770},
                {"id": "e6", "latitude": 9.046, "longitude": 38.800},
                {"id": "e7", "latitude": 9.012, "longitude": 38.820},
                {"id": "e8", "latitude": 9.060, "longitude": 38.760},
                {"id": "e9", "latitude": 9.070,"longitude": 38.740},
                {"id": "e10", "latitude": 8.900, "longitude": 38.750} 
            ]
            },
            "shuttles": [
            {"id": 1, "capacity": 6},
            {"id": 2, "capacity": 7},
            {"id": 3, "capacity": 4}
            ]
        },
        {
            "locations": {
            "HQ": [-1.2921, 36.8219],
            "employees": [
                {"id": "e11", "latitude": -1.280, "longitude": 36.830},
                {"id": "e12", "latitude": -1.300, "longitude": 36.810},
                {"id": "e13", "latitude": -1.310, "longitude": 36.815},
                {"id": "e14", "latitude": -1.295, "longitude": 36.800},
                {"id": "e15", "latitude": -1.289, "longitude": 36.825},
                {"id": "e16", "latitude": -1.250, "longitude": 36.850},
                {"id": "e17", "latitude": -1.350, "longitude": 36.880},
                {"id": "e18", "latitude": -1.270, "longitude": 36.890},
                {"id": "e19", "latitude": -1.260, "longitude": 36.800},
                {"id": "e20", "latitude": 0.100, "longitude": 37.000} 
            ]
            },
            "shuttles": [
            {"id": 4, "capacity": 6},
            {"id": 5, "capacity": 6},
            {"id": 6, "capacity": 8}
            ]
        },
        {
            "locations": {
            "HQ": [40.7128, -74.0060],
            "employees": [
                {"id": "e21", "latitude": 40.720, "longitude": -74.000},
                {"id": "e22", "latitude": 40.730, "longitude": -74.010},
                {"id": "e23", "latitude": 40.740, "longitude": -73.990},
                {"id": "e24", "latitude": 40.715, "longitude": -73.980},
                {"id": "e25", "latitude": 40.700, "longitude": -74.020},
                {"id": "e26", "latitude": 40.750, "longitude": -74.050},
                {"id": "e27", "latitude": 40.760, "longitude": -74.060},
                {"id": "e28", "latitude": 40.780, "longitude": -74.100},
                {"id": "e29", "latitude": 40.800, "longitude": -74.200},
                {"id": "e30", "latitude": 41.000, "longitude": -75.000} 
            ]
            },
            "shuttles": [
            {"id": 7, "capacity": 5},
            {"id": 8, "capacity": 4},
            {"id": 9, "capacity": 7}
            ]
        }
    ]

    headers = {"Content-Type": "application/json"}
    for test_data in test_data_list:
        response = requests.post(f"{BASE_URL}/clustering", data=json.dumps(test_data), headers=headers)
        
        assert response.status_code == 200
        
        response_data = response.json()
        print(json.dumps(response_data))
        
        assert "routes" in response_data
        assert isinstance(response_data["routes"], list)
        
        assert len(response_data["routes"]) <= len(test_data["shuttles"])

if __name__ == "__main__":
    test_assign_routes_1()
    test_assign_routes_2()
    test_assign_routes_3()
