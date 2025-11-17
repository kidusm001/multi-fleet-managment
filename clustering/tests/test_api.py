import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json
from src.main import app


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check(self):
        """Test basic health check"""
        client = TestClient(app)
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "route-assignment"


class TestClusteringEndpoint:
    """Test the main clustering endpoint"""

    def setup_method(self):
        """Setup for each test"""
        self.client = TestClient(app)
        self.valid_request = {
            "locations": {
                "HQ": [9.0222, 38.7468],
                "employees": [
                    {"id": "emp1", "latitude": 9.0322, "longitude": 38.7568},
                    {"id": "emp2", "latitude": 9.0422, "longitude": 38.7668},
                ]
            },
            "shuttles": [
                {"id": "shuttle1", "capacity": 2},
                {"id": "shuttle2", "capacity": 1}
            ]
        }

    def test_clustering_success(self):
        """Test successful clustering request"""
        response = self.client.post("/clustering", json=self.valid_request)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "routes" in data
        assert isinstance(data["routes"], list)
        assert "verification_passed" in data
        assert "total_demand" in data
        assert "total_capacity" in data

    def test_clustering_no_shuttles(self):
        """Test clustering with no shuttles"""
        request_data = self.valid_request.copy()
        request_data["shuttles"] = []

        response = self.client.post("/clustering", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is False
        assert "At least one shuttle is required" in data["message"]
        assert data["routes"] == []

    def test_clustering_no_employees(self):
        """Test clustering with no employees"""
        request_data = self.valid_request.copy()
        request_data["locations"]["employees"] = []

        response = self.client.post("/clustering", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "No employees to assign" in data["message"]
        assert data["routes"] == []

    def test_clustering_invalid_data(self):
        """Test clustering with invalid data"""
        invalid_request = {"invalid": "data"}

        response = self.client.post("/clustering", json=invalid_request)

        # Should return 422 for validation error
        assert response.status_code == 422

    @patch('src.main.assign_routes.assign_employees_to_shuttles')
    def test_clustering_algorithm_failure(self, mock_assign):
        """Test handling of algorithm failure"""
        mock_assign.return_value = None  # Simulate no solution found

        response = self.client.post("/clustering", json=self.valid_request)

        assert response.status_code == 500

    @patch('src.main.assign_routes.assign_employees_to_shuttles')
    def test_clustering_with_algorithm_response(self, mock_assign):
        """Test clustering with mocked algorithm response"""
        # Mock successful assignment
        mock_routes = [[0, 1], [0, 2]]  # Two routes
        mock_assign.return_value = mock_routes

        with patch('src.main.assign_routes.verify_unique_assignments', return_value=True):
            response = self.client.post("/clustering", json=self.valid_request)

            assert response.status_code == 200
            data = response.json()

            assert data["success"] is True
            assert len(data["routes"]) == 2
            assert data["verification_passed"] is True

    @patch('src.main.assign_routes.assign_employees_to_shuttles')
    def test_clustering_algorithm_exception(self, mock_assign):
        """Test handling of algorithm exceptions"""
        # Mock the algorithm to raise an exception
        mock_assign.side_effect = Exception("Algorithm failed")

        response = self.client.post("/clustering", json=self.valid_request)

        assert response.status_code == 500
        response_data = response.json()
        assert "Algorithm failed" in response_data["detail"]


class TestRootEndpoint:
    """Test root endpoint"""

    def test_root_endpoint(self):
        """Test root endpoint returns correct message"""
        client = TestClient(app)
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Route Assignment API is running"


class TestConcurrentRequests:
    """Test concurrent request handling"""

    def test_concurrent_clustering_requests(self):
        """Test that concurrent requests are handled properly"""
        client = TestClient(app)

        # Create multiple requests
        requests_data = [
            {
                "locations": {
                    "HQ": [9.0222, 38.7468],
                    "employees": [
                        {"id": f"emp{i}", "latitude": 9.0322 + i*0.01, "longitude": 38.7568 + i*0.01}
                        for i in range(3)
                    ]
                },
                "shuttles": [{"id": f"shuttle{j}", "capacity": 2} for j in range(2)]
            }
            for _ in range(3)
        ]

        # Make concurrent requests (in sequence for testing, but simulates concurrency)
        responses = []
        for request_data in requests_data:
            response = client.post("/clustering", json=request_data)
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True


class TestErrorHandling:
    """Test error handling scenarios"""

    def test_malformed_json(self):
        """Test handling of malformed JSON"""
        client = TestClient(app)

        response = client.post(
            "/clustering",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422  # FastAPI returns 422 for unprocessable entity

    def test_missing_required_fields(self):
        """Test handling of missing required fields"""
        client = TestClient(app)

        incomplete_request = {
            "locations": {
                "HQ": [9.0222, 38.7468]
                # Missing employees
            }
            # Missing shuttles
        }

        response = client.post("/clustering", json=incomplete_request)

        assert response.status_code == 422  # Validation error

    def test_invalid_coordinates(self):
        """Test handling of invalid coordinates"""
        client = TestClient(app)

        invalid_request = {
            "locations": {
                "HQ": ["invalid", "coordinates"],
                "employees": [
                    {"id": "emp1", "latitude": "invalid", "longitude": "coords"}
                ]
            },
            "shuttles": [{"id": "shuttle1", "capacity": 1}]
        }

        response = client.post("/clustering", json=invalid_request)

        assert response.status_code == 422  # Validation error