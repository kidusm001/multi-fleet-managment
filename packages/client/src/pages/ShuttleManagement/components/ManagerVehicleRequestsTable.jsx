import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Common/UI/Card';
import { Button } from '@/components/Common/UI/Button';
import { Badge } from '@/components/Common/UI/Badge';
import { Loader2, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export default function ManagerVehicleRequestsTable() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/vehicle-requests/my-requests');
      setRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching my vehicle requests:', err);
      setError(err.response?.data?.message || 'Failed to load requests');
      toast.error('Failed to load your vehicle requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        label: 'Pending'
      },
      APPROVED: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        label: 'Approved'
      },
      REJECTED: {
        icon: XCircle,
        color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        label: 'Rejected'
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn('inline-flex items-center gap-1', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleRefresh = () => {
      fetchMyRequests();
    };

    window.addEventListener('vehicle-request:refresh', handleRefresh);
    return () => {
      window.removeEventListener('vehicle-request:refresh', handleRefresh);
    };
  }, [fetchMyRequests]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this vehicle request?')) {
      return;
    }

    try {
      await api.delete(`/vehicle-requests/${requestId}`);
      toast.success('Vehicle request deleted successfully');
      fetchMyRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(err.response?.data?.message || 'Failed to delete request');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            My Vehicle Requests
          </CardTitle>
          <CardDescription>
            View your vehicle acquisition requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            My Vehicle Requests
          </CardTitle>
          <CardDescription>
            View your vehicle acquisition requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            <XCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">Error loading requests</p>
            <p className="text-sm mt-1">{error}</p>
            <Button
              onClick={fetchMyRequests}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          My Vehicle Requests
        </CardTitle>
        <CardDescription>
          View your vehicle acquisition requests and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No vehicle requests yet</p>
            <p className="text-sm mt-1">Submit your first vehicle acquisition request</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  'bg-card hover:bg-accent/50'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      Requested {formatDate(request.requestedAt)}
                    </span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vehicle Name</p>
                    <p className="text-sm">{request.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">License Plate</p>
                    <p className="text-sm font-mono">{request.licensePlate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-sm">{request.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Model</p>
                    <p className="text-sm">{request.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="text-sm">{request.capacity || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Rate</p>
                    <p className="text-sm">{request.dailyRate ? `$${request.dailyRate}` : 'N/A'}</p>
                  </div>
                </div>

                {request.category && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-sm">{request.category.name}</p>
                  </div>
                )}

                {request.vendor && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                    <p className="text-sm">{request.vendor}</p>
                  </div>
                )}

                {request.comment && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Comment</p>
                    <p className="text-sm italic">{request.comment}</p>
                  </div>
                )}

                {request.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* TODO: Implement edit functionality */}}
                      disabled
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}