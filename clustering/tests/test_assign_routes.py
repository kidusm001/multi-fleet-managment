import pytest
import numpy as np
import math
from unittest.mock import patch, MagicMock
from src.assign_routes import (
    calculate_bearing,
    calculate_distance_and_bearing_matrix,
    assign_employees_to_shuttles,
    verify_unique_assignments
)


class TestCalculateBearing:
    """Test bearing calculation functionality"""

    def test_calculate_bearing_north(self):
        """Test bearing calculation for north direction"""
        result = calculate_bearing([0, 0], [1, 0])  # North
        assert abs(result - 0) < 0.01

    def test_calculate_bearing_east(self):
        """Test bearing calculation for east direction"""
        result = calculate_bearing([0, 0], [0, 1])  # East
        assert abs(result - 90) < 0.01

    def test_calculate_bearing_south(self):
        """Test bearing calculation for south direction"""
        result = calculate_bearing([0, 0], [-1, 0])  # South
        assert abs(result - 180) < 0.01

    def test_calculate_bearing_west(self):
        """Test bearing calculation for west direction"""
        result = calculate_bearing([0, 0], [0, -1])  # West
        assert abs(result - 270) < 0.01

    def test_calculate_bearing_northeast(self):
        """Test bearing calculation for northeast direction"""
        result = calculate_bearing([0, 0], [1, 1])  # Northeast
        assert abs(result - 45) < 0.01


class TestDistanceAndBearingMatrix:
    """Test distance and bearing matrix calculations"""

    def test_calculate_distance_and_bearing_matrix_basic(self):
        """Test basic distance and bearing matrix calculation"""
        locations = [[0, 0], [1, 0], [0, 1]]  # Origin, North, East

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)

        # Check dimensions
        assert len(distance_matrix) == 3
        assert len(distance_matrix[0]) == 3
        assert len(bearing_matrix) == 3
        assert len(bearing_matrix[0]) == 3

        # Check diagonal is zero
        for i in range(3):
            assert distance_matrix[i][i] == 0.0
            assert bearing_matrix[i][i] == 0.0

    def test_calculate_distance_and_bearing_matrix_real_coordinates(self):
        """Test with real Addis Ababa coordinates"""
        # Addis Ababa coordinates (simplified)
        locations = [
            [9.0222, 38.7468],  # HQ
            [9.0322, 38.7568],  # Employee 1
            [9.0122, 38.7368],  # Employee 2
        ]

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)

        # All distances should be positive (except diagonal)
        for i in range(len(locations)):
            for j in range(len(locations)):
                if i != j:
                    assert distance_matrix[i][j] > 0
                    assert 0 <= bearing_matrix[i][j] <= 360

    def test_calculate_distance_and_bearing_matrix_symmetry(self):
        """Test that distance matrix is symmetric"""
        locations = [[0, 0], [1, 1], [2, 2]]

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)

        # Distance matrix should be symmetric
        for i in range(len(locations)):
            for j in range(len(locations)):
                assert distance_matrix[i][j] == distance_matrix[j][i]


class TestAssignEmployeesToShuttles:
    """Test the core shuttle assignment algorithm"""

    def test_assign_employees_to_shuttles_simple(self):
        """Test simple shuttle assignment"""
        # Simple locations: HQ at origin, employees at cardinal directions
        locations = [
            [0, 0],      # HQ
            [0, 1],      # Employee 1 (East)
            [1, 0],      # Employee 2 (North)
            [0, -1],     # Employee 3 (West)
        ]

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)
        shuttle_capacities = [2, 1]  # Two shuttles: capacity 2 and 1

        routes = assign_employees_to_shuttles(
            locations, distance_matrix, bearing_matrix, shuttle_capacities
        )

        assert routes is not None
        assert len(routes) <= len(shuttle_capacities)

        # Verify all employees are assigned
        assigned_employees = []
        for route in routes:
            assigned_employees.extend(route[1:])  # Skip HQ

        # Should have 3 employees assigned
        assert len(assigned_employees) == 3
        assert set(assigned_employees) == {1, 2, 3}

    def test_assign_employees_to_shuttles_capacity_constraint(self):
        """Test that capacity constraints are respected"""
        locations = [
            [0, 0],      # HQ
            [0, 1], [0, 2], [0, 3], [0, 4],  # 4 employees in a line
        ]

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)
        shuttle_capacities = [2, 2]  # Two shuttles with capacity 2 each

        routes = assign_employees_to_shuttles(
            locations, distance_matrix, bearing_matrix, shuttle_capacities
        )

        assert routes is not None

        # Check capacity constraints
        for route in routes:
            employee_count = len(route) - 1  # Subtract HQ
            assert employee_count <= 2

    def test_assign_employees_to_shuttles_no_solution(self):
        """Test case where no solution exists"""
        locations = [
            [0, 0],      # HQ
            [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],  # 5 employees
        ]

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)
        shuttle_capacities = [1, 1]  # Total capacity 2, but 5 employees

        routes = assign_employees_to_shuttles(
            locations, distance_matrix, bearing_matrix, shuttle_capacities
        )

        # Should return None when no solution exists
        assert routes is None

    @patch('src.assign_routes.pywrapcp')
    def test_assign_employees_to_shuttles_solver_failure(self, mock_pywrapcp):
        """Test handling of solver failure"""
        # Mock the solver to return None
        mock_solver = MagicMock()
        mock_solver.SolveWithParameters.return_value = None
        mock_pywrapcp.RoutingModel.return_value.SolveWithParameters.return_value = None

        locations = [[0, 0], [0, 1]]
        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)
        shuttle_capacities = [1]

        routes = assign_employees_to_shuttles(
            locations, distance_matrix, bearing_matrix, shuttle_capacities
        )

        assert routes is None


class TestVerifyUniqueAssignments:
    """Test assignment verification functionality"""

    def test_verify_unique_assignments_valid(self):
        """Test verification of valid assignments"""
        routes = [
            [0, 1, 2],  # Shuttle 1: HQ + employees 1,2
            [0, 3, 4],  # Shuttle 2: HQ + employees 3,4
        ]
        num_employees = 4

        result = verify_unique_assignments(routes, num_employees)
        assert result is True

    def test_verify_unique_assignments_duplicate(self):
        """Test detection of duplicate assignments"""
        routes = [
            [0, 1, 2],  # Shuttle 1: HQ + employees 1,2
            [0, 2, 3],  # Shuttle 2: HQ + employees 2,3 (duplicate!)
        ]
        num_employees = 3

        result = verify_unique_assignments(routes, num_employees)
        assert result is False

    def test_verify_unique_assignments_missing(self):
        """Test detection of missing assignments"""
        routes = [
            [0, 1, 2],  # Shuttle 1: HQ + employees 1,2
            [0, 3],     # Shuttle 2: HQ + employee 3 (missing employee 4)
        ]
        num_employees = 4

        result = verify_unique_assignments(routes, num_employees)
        assert result is False

    def test_verify_unique_assignments_empty_routes(self):
        """Test verification with empty routes"""
        routes = []
        num_employees = 0

        result = verify_unique_assignments(routes, num_employees)
        assert result is True

    def test_verify_unique_assignments_single_employee(self):
        """Test verification with single employee"""
        routes = [[0, 1]]  # HQ + employee 1
        num_employees = 1

        result = verify_unique_assignments(routes, num_employees)
        assert result is True


class TestIntegrationScenarios:
    """Test complete integration scenarios"""

    def test_addis_ababa_scenario(self):
        """Test with Addis Ababa coordinates"""
        # Simplified Addis Ababa scenario
        locations = [
            [9.0222, 38.7468],   # HQ
            [9.0322, 38.7568],   # Employee near HQ
            [9.0422, 38.7668],   # Employee further out
            [9.0522, 38.7768],   # Employee even further
        ]

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)
        shuttle_capacities = [2, 1]  # Two shuttles

        routes = assign_employees_to_shuttles(
            locations, distance_matrix, bearing_matrix, shuttle_capacities
        )

        assert routes is not None
        assert len(routes) <= 2  # Max 2 shuttles

        # Verify assignments
        num_employees = 3
        verification_passed = verify_unique_assignments(routes, num_employees)
        assert verification_passed

    def test_large_scale_scenario(self):
        """Test with larger number of employees"""
        # Generate 20 employees in a grid pattern
        locations = [[0, 0]]  # HQ
        for i in range(4):
            for j in range(5):
                locations.append([i * 0.1, j * 0.1])

        distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)
        shuttle_capacities = [5, 5, 5, 5]  # Four shuttles with capacity 5 each

        routes = assign_employees_to_shuttles(
            locations, distance_matrix, bearing_matrix, shuttle_capacities
        )

        assert routes is not None

        # Verify all 20 employees are assigned
        num_employees = 20
        verification_passed = verify_unique_assignments(routes, num_employees)
        assert verification_passed