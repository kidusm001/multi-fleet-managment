import React, { useEffect, useState } from "react";
import { Button } from "@/components/Common/UI/Button";
import { Card } from "@/components/Common/UI/Card";
import { cn } from "@/lib/utils";
import { RefreshCw, Check, X, User, Calendar, MapPin } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function EmployeeShuttleRequestsTable() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  const fetchPendingRequests = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get('/api/shuttle-requests-employee');
      setPendingRequests(response.data?.data || response.data || []);
    } catch (err) {
      setError("Failed to load pending employee shuttle requests");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleRefresh = () => {
    fetchPendingRequests(true);
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(`/api/shuttle-requests-employee/${id}/status`, { status: 'APPROVED' });
      await fetchPendingRequests();
      toast.success('Employee shuttle request approved');
    } catch (err) {
      console.error("Approve error:", err);
      toast.error('Failed to approve request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(`/api/shuttle-requests-employee/${id}/status`, { status: 'REJECTED' });
      await fetchPendingRequests();
      toast.success('Employee shuttle request rejected');
    } catch (err) {
      console.error("Reject error:", err);
      toast.error('Failed to reject request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
        Loading employee shuttle requests...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-red-500 dark:text-red-400">
        {error}
      </Card>
    );
  }

  return (
    <Card className="mt-6 overflow-x-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Employee Shuttle Requests
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn(
            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            "border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          No employee shuttle requests.
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Shift</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pickup Location</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-4 py-2 center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {pendingRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {request.employee?.user?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {request.employee?.user?.email || ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(request.date).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {request.shift?.name || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {request.pickupLocation || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    request.status === 'PENDING' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                    request.status === 'APPROVED' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    request.status === 'REJECTED' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center flex justify-center space-x-2">
                  {request.status === 'PENDING' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading[request.id]}
                        onClick={() => handleApprove(request.id)}
                        className={cn(
                          "inline-flex items-center rounded-full",
                          "border border-green-300 dark:border-green-700",
                          "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40",
                          "text-green-600 dark:text-green-400",
                          "transition-all duration-200 transform hover:scale-105",
                          "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                        )}
                      >
                        {actionLoading[request.id] ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span className="ml-1">Approve</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading[request.id]}
                        onClick={() => handleReject(request.id)}
                        className={cn(
                          "inline-flex items-center rounded-full",
                          "border border-red-300 dark:border-red-700",
                          "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40",
                          "text-red-600 dark:text-red-400",
                          "transition-all duration-200 transform hover:scale-105",
                          "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                        )}
                      >
                        {actionLoading[request.id] ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span className="ml-1">Reject</span>
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}