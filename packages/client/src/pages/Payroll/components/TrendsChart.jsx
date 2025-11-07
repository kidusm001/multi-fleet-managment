import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parse, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

const TrendsChart = ({ organizationId, dimensionType = 'department' }) => {
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [interval, setInterval] = useState('daily'); // daily, weekly, monthly
  const [dimension, setDimension] = useState(dimensionType);
  const [specificDimension, setSpecificDimension] = useState(''); // e.g., department ID or shift ID

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const start = format(startDate, 'yyyy-MM-dd');
      const end = format(endDate, 'yyyy-MM-dd');
      
      let url = `/api/kpi/trends?organizationId=${organizationId}&startDate=${start}&endDate=${end}&interval=${interval}`;
      if (specificDimension) {
        url += `&dimensionType=${dimension}&dimensionId=${specificDimension}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch trend data');
      const data = await response.json();
      
      // Transform data for charts
      const transformed = data.map(item => ({
        ...item,
        date: item.period, // Backend returns 'period' not 'date'
        formattedDate: format(new Date(item.period), interval === 'daily' ? 'MMM dd' : interval === 'weekly' ? 'MMM dd' : 'MMM yyyy')
      }));
      
      setTrendsData(transformed);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchTrends();
    }
  }, [organizationId, startDate, endDate, interval, dimension, specificDimension]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <h3 className="font-semibold">Error loading trend data</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!trendsData || trendsData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        <p>No trend data available for this period and dimension.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payroll Trends</h2>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dimension</label>
            <select
              value={dimension}
              onChange={(e) => {
                setDimension(e.target.value);
                setSpecificDimension('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="department">Department</option>
              <option value="shift">Shift</option>
              <option value="route">Route</option>
              <option value="vehicle_category">Vehicle Category</option>
              <option value="location">Location</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={(e) => setStartDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={(e) => setEndDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Cost Trend Chart */}
      {trendsData[0]?.dailyCost !== undefined && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Cost Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendsData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="dailyCost" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorCost)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Employee Count Trend */}
      {trendsData[0]?.employeeCount !== undefined && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Count Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="employeeCount" 
                stroke="#10b981" 
                name="Employees"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Per Employee Trend */}
      {trendsData[0]?.costPerEmployee !== undefined && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Per Employee Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Line 
                type="monotone" 
                dataKey="costPerEmployee" 
                stroke="#f59e0b" 
                name="Cost/Employee"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Overtime Trend */}
      {trendsData[0]?.overtimePercentage !== undefined && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime Percentage Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Line 
                type="monotone" 
                dataKey="overtimePercentage" 
                stroke="#ef4444" 
                name="Overtime %"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trend Table */}
      <div className="overflow-x-auto mt-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
              {trendsData[0]?.dailyCost !== undefined && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Daily Cost</th>
              )}
              {trendsData[0]?.employeeCount !== undefined && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employees</th>
              )}
              {trendsData[0]?.costPerEmployee !== undefined && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost/Employee</th>
              )}
              {trendsData[0]?.overtimePercentage !== undefined && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Overtime %</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trendsData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.formattedDate}</td>
                {row.dailyCost !== undefined && (
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                    ${(row.dailyCost / 1000).toFixed(1)}K
                  </td>
                )}
                {row.employeeCount !== undefined && (
                  <td className="px-6 py-4 text-sm text-gray-600">{row.employeeCount}</td>
                )}
                {row.costPerEmployee !== undefined && (
                  <td className="px-6 py-4 text-sm text-gray-600">
                    ${row.costPerEmployee.toFixed(2)}
                  </td>
                )}
                {row.overtimePercentage !== undefined && (
                  <td className={`px-6 py-4 text-sm font-medium ${row.overtimePercentage > 10 ? 'text-red-600' : 'text-gray-600'}`}>
                    {row.overtimePercentage.toFixed(1)}%
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendsChart;
