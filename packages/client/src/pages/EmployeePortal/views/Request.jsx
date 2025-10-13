import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { Button } from '@/components/Common/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Common/UI/Card';
import { Input } from '@/components/Common/UI/Input';
import { Label } from '@/components/Common/UI/Label';
import { Calendar, Clock, MapPin, Send, Loader2, CheckCircle, XCircle, AlertCircle, Bus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';

/**
 * Request View - Employee Shuttle Request
 * Allows employees to request shuttle services for commuting
 */
export default function RequestView() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Days limit between requests
  const REQUEST_COOLDOWN_DAYS = 7;
  
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [canRequest, setCanRequest] = useState(true);
  const [nextRequestDate, setNextRequestDate] = useState(null);
  
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const checkRequestCooldown = useCallback((requests) => {
    if (requests.length === 0) {
      setCanRequest(true);
      setNextRequestDate(null);
      return;
    }

    // Find the most recent request
    const sortedRequests = requests.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    const lastRequest = sortedRequests[0];
    const lastRequestDate = new Date(lastRequest.createdAt || lastRequest.date);
    
    // Calculate next allowed request date
    const nextAllowedDate = new Date(lastRequestDate);
    nextAllowedDate.setDate(nextAllowedDate.getDate() + REQUEST_COOLDOWN_DAYS);
    
    const now = new Date();
    const canRequestNow = now >= nextAllowedDate;
    
    setCanRequest(canRequestNow);
    setNextRequestDate(canRequestNow ? null : nextAllowedDate);
  }, [REQUEST_COOLDOWN_DAYS]);

  const fetchMyRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await axios.get('/api/shuttle-requests-employee/my-requests');
      const requests = response.data?.data || response.data || [];
      setMyRequests(requests);
      
      // Check if employee can make a new request (cooldown period)
      checkRequestCooldown(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  }, [checkRequestCooldown]);

  const fetchCurrentEmployee = useCallback(async () => {
    try {
      setLoadingEmployee(true);
      const employee = await employeeService.getCurrentEmployee();
      setCurrentEmployee(employee);
    } catch (error) {
      console.error('Error fetching current employee:', error);
    } finally {
      setLoadingEmployee(false);
    }
  }, []);

  // Fetch my requests
  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Fetch current employee data
  useEffect(() => {
    fetchCurrentEmployee();
  }, [fetchCurrentEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check cooldown before submitting
    if (!canRequest) {
      toast.error('You cannot submit a new request yet. Please wait for the cooldown period to end.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/shuttle-requests-employee', {
        date: formData.requestDate,
        notes: formData.notes?.trim() || null,
      });

      toast.success('Shuttle request submitted successfully');
      setFormData({
        requestDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchMyRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', label: 'Pending' },
      APPROVED: { icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', label: 'Approved' },
      REJECTED: { icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', label: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const isEmployeeAssigned = () => {
    return currentEmployee && (currentEmployee.assigned || currentEmployee.stopId);
  };

  const getAssignedShuttleInfo = () => {
    if (!currentEmployee) return null;
    
    const stop = currentEmployee.stop;
    const route = stop?.route;
    const vehicle = route?.vehicle;
    
    return {
      stopName: stop?.name || 'N/A',
      stopAddress: stop?.address || 'N/A',
      routeName: route?.name || 'N/A',
      vehicleName: vehicle?.name || 'N/A',
      vehiclePlate: vehicle?.plateNumber || 'N/A',
      shiftName: currentEmployee.shift?.name || 'N/A'
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Request Shuttle Service</h1>
        <p className="text-muted-foreground mt-1">
          Submit your commute requests and view request status
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form or Assigned Shuttle Info */}
        {loadingEmployee ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : isEmployeeAssigned() ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5" />
                Your Assigned Shuttle
              </CardTitle>
              <CardDescription>
                You are currently assigned to a shuttle route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const shuttleInfo = getAssignedShuttleInfo();
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Route</Label>
                        <p className="text-sm font-medium">{shuttleInfo.routeName}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Shift</Label>
                        <p className="text-sm font-medium">{shuttleInfo.shiftName}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Stop</Label>
                        <p className="text-sm font-medium">{shuttleInfo.stopName}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Vehicle</Label>
                        <p className="text-sm font-medium">{shuttleInfo.vehicleName}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Pickup Location
                      </Label>
                      <p className="text-sm">{shuttleInfo.stopAddress}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">License Plate</Label>
                      <p className="text-sm font-mono">{shuttleInfo.vehiclePlate}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                New Request
              </CardTitle>
              <CardDescription>
                Submit a shuttle request for your commute (one request per {REQUEST_COOLDOWN_DAYS} days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canRequest && nextRequestDate && (
                <div className={cn(
                  'p-4 rounded-lg border mb-4',
                  isDark ? 'border-yellow-700 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
                )}>
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Request Cooldown Active</span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    You can submit your next request on {nextRequestDate.toLocaleDateString()} 
                    ({Math.ceil((nextRequestDate - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Request Date */}
                <div className="space-y-2">
                  <Label htmlFor="requestDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Request Date
                  </Label>
                  <Input
                    id="requestDate"
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    placeholder="Any special instructions or notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 rounded-md border resize-none transition-colors',
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-primary'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary'
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={loading || !canRequest} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : !canRequest ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Request Cooldown Active
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            My Requests
          </CardTitle>
          <CardDescription>
            View your shuttle request history and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No requests yet</p>
              <p className="text-sm mt-1">Submit your first shuttle request</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(request.date).toLocaleDateString()}
                      </span>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{request.shift?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{request.pickupLocation}</span>
                    </div>
                    {request.notes && (
                      <p className="text-muted-foreground mt-2 text-xs italic">
                        Note: {request.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
