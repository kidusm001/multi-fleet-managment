import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parse } from 'date-fns';

const KPIDashboard = ({ organizationId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/kpi/dashboard?organizationId=${organizationId}&startDate=${start}&endDate=${end}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch KPI dashboard');
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchDashboard();
    }
  }, [organizationId, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <h3 className="font-semibold">Error loading KPI Dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payroll KPI Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Period: {startDate && !isNaN(startDate) ? format(startDate, 'MMM dd, yyyy') : 'Invalid'} - {endDate && !isNaN(endDate) ? format(endDate, 'MMM dd, yyyy') : 'Invalid'}
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate && !isNaN(startDate) ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const parsed = parse(e.target.value, 'yyyy-MM-dd', new Date());
                if (!isNaN(parsed)) {
                  setStartDate(parsed);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate && !isNaN(endDate) ? format(endDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const parsed = parse(e.target.value, 'yyyy-MM-dd', new Date());
                if (!isNaN(parsed)) {
                  setEndDate(parsed);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchDashboard}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Total Cost</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            ${(dashboardData.totalCost / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-gray-500 mt-2">Period Total</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Total Employees</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalEmployees}</div>
          <div className="text-xs text-gray-500 mt-2">Active</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Avg Cost/Employee</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            ${dashboardData.avgCostPerEmployee.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-2">Per Person</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Total Vehicles</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalVehicles}</div>
          <div className="text-xs text-gray-500 mt-2">Fleet Size</div>
        </div>
      </div>

      {/* Top Insights */}
      {(dashboardData.topCostDepartment || dashboardData.highestOvertimeShift) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {dashboardData.topCostDepartment && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="text-red-700 font-semibold">⚠️ Highest Cost Department</div>
              <div className="text-lg font-bold text-red-900 mt-2">
                {dashboardData.topCostDepartment.departmentName}
              </div>
              <div className="text-red-600 text-sm mt-1">
                ${(dashboardData.topCostDepartment.totalCost / 1000).toFixed(1)}K
              </div>
            </div>
          )}

          {dashboardData.highestOvertimeShift && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="text-orange-700 font-semibold">⏰ Highest Overtime Shift</div>
              <div className="text-lg font-bold text-orange-900 mt-2">
                {dashboardData.highestOvertimeShift.shiftName}
              </div>
              <div className="text-orange-600 text-sm mt-1">
                {dashboardData.highestOvertimeShift.overtimePercentage.toFixed(1)}% overtime
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Costs */}
        {dashboardData.departmentKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.departmentKPIs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departmentName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
                <Bar dataKey="totalCost" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Shift Analysis */}
        {dashboardData.shiftKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Cost Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.shiftKPIs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shiftName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="costPerHour" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Vehicle Category Distribution */}
        {dashboardData.vehicleCategoryKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Category Costs</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.vehicleCategoryKPIs}
                  dataKey="totalCost"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {dashboardData.vehicleCategoryKPIs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Route Efficiency */}
        {dashboardData.routeKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Cost Efficiency</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.routeKPIs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="routeName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="costPerKm" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Location Costs */}
        {dashboardData.locationKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Location</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.locationKPIs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="locationName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
                <Bar dataKey="totalCost" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Tables */}
      <div className="space-y-6">
        {/* Department Details */}
        {dashboardData.departmentKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Department Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost/Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Utilization Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Budget Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.departmentKPIs.map((dept) => (
                    <tr key={dept.departmentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.departmentName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dept.employeeCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        ${(dept.totalCost / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        ${dept.costPerEmployee.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(dept.utilizationRate, 100)}%` }}
                            />
                          </div>
                          <span className="ml-2 text-gray-600">{dept.utilizationRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold ${dept.budgetVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dept.budgetVariance > 0 ? '+' : ''}{dept.budgetVariance.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shift Details */}
        {dashboardData.shiftKPIs?.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Shift Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Shift Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost/Hour</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Overtime %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Avg Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.shiftKPIs.map((shift) => (
                    <tr key={shift.shiftId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{shift.shiftName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        ${shift.costPerHour.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={shift.overtimePercentage > 10 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {shift.overtimePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{shift.employeeCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{shift.avgHoursWorked.toFixed(0)}h</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        ${(shift.totalCost / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIDashboard;
