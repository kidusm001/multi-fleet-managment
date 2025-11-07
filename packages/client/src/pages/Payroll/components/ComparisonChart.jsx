import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parse } from 'date-fns';

const ComparisonChart = ({ organizationId }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStartDate, setCurrentStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [currentEndDate, setCurrentEndDate] = useState(new Date());
  const [previousStartDate, setPreviousStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const [previousEndDate, setPreviousEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 0));

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const currentStart = format(currentStartDate, 'yyyy-MM-dd');
      const currentEnd = format(currentEndDate, 'yyyy-MM-dd');
      const prevStart = format(previousStartDate, 'yyyy-MM-dd');
      const prevEnd = format(previousEndDate, 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/kpi/compare?organizationId=${organizationId}&currentStartDate=${currentStart}&currentEndDate=${currentEnd}&previousStartDate=${prevStart}&previousEndDate=${prevEnd}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const data = await response.json();
      setComparisonData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchComparison();
    }
  }, [organizationId, currentStartDate, currentEndDate, previousStartDate, previousEndDate]);

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
        <h3 className="font-semibold">Error loading comparison data</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!comparisonData) return null;

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈 ↑';
    if (trend === 'down') return '📉 ↓';
    return '➡️ —';
  };

  const getTrendColor = (changePercentage) => {
    if (changePercentage > 5) return 'text-red-600 bg-red-50';
    if (changePercentage < -5) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Transform the flat comparison data for display
  const metrics = [
    { 
      label: 'Total Cost', 
      ...comparisonData.totalCost,
      format: (val) => `$${val.toFixed(2)}`
    },
    { 
      label: 'Cost Per Employee', 
      ...comparisonData.costPerEmployee,
      format: (val) => val > 0 ? `$${val.toFixed(2)}` : 'N/A'
    },
    { 
      label: 'Total Employees', 
      ...comparisonData.totalEmployees,
      format: (val) => Math.round(val)
    },
    { 
      label: 'Avg Utilization Rate', 
      ...comparisonData.avgUtilizationRate,
      format: (val) => `${val.toFixed(1)}%`
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Period Comparison</h2>

      {/* Date Range Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Period */}
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 mb-4">Current Period</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">Start Date</label>
              <input
                type="date"
                value={format(currentStartDate, 'yyyy-MM-dd')}
                onChange={(e) => setCurrentStartDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">End Date</label>
              <input
                type="date"
                value={format(currentEndDate, 'yyyy-MM-dd')}
                onChange={(e) => setCurrentEndDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Previous Period */}
        <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-gray-400">
          <h3 className="font-semibold text-gray-900 mb-4">Previous Period</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={format(previousStartDate, 'yyyy-MM-dd')}
                onChange={(e) => setPreviousStartDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={format(previousEndDate, 'yyyy-MM-dd')}
                onChange={(e) => setPreviousEndDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="mb-3">
              <p className="text-blue-700 text-sm font-medium">{metric.label}</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {metric.format(metric.current)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Previous: {metric.format(metric.previous)}
              </p>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-lg ${getTrendColor(metric.changePercentage)}`}>
              <span className="text-xl">{getTrendIcon(metric.trend)}</span>
              <span className="text-lg font-bold">
                {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Change: {metric.format(Math.abs(metric.change))} {metric.change >= 0 ? 'increase' : 'decrease'}
            </p>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-15} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="previous" fill="#9ca3af" name="Previous Period" />
            <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonChart;
