import React, { useState, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { Button } from '@/components/Common/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Common/UI/Card';
import { Input } from '@/components/Common/UI/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/UI/Select';
import { Label } from '@/components/Common/UI/Label';
import { Calendar, Clock, MapPin, Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { cn } from '@/lib/utils';

/**
 * Request View - Employee Shuttle Request
 * Allows employees to request shuttle services for commuting
 */
export default function RequestView() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().split('T')[0],
    shiftId: '',
    pickupLocation: '',
    notes: '',
  });

  // Fetch shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await axios.get('/api/shifts');
        setShifts(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching shifts:', error);
        toast.error('Failed to load shifts');
      }
    };
    fetchShifts();
  }, []);

  // Fetch my requests
  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await axios.get('/api/shuttle-requests-employee/my-requests');
      setMyRequests(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.shiftId) {
      toast.error('Please select a shift');
      return;
    }

    if (!formData.pickupLocation?.trim()) {
      toast.error('Please enter your pickup location');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/shuttle-requests-employee', {
        date: formData.requestDate,
        shiftId: formData.shiftId,
        pickupLocation: formData.pickupLocation.trim(),
        notes: formData.notes?.trim() || null,
      });

      toast.success('Shuttle request submitted successfully');
      setFormData({
        requestDate: new Date().toISOString().split('T')[0],
        shiftId: '',
        pickupLocation: '',
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
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              New Request
            </CardTitle>
            <CardDescription>
              Submit a shuttle request for your commute
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              {/* Shift Selection */}
              <div className="space-y-2">
                <Label htmlFor="shiftId" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Shift
                </Label>
                <Select
                  value={formData.shiftId}
                  onValueChange={(value) => setFormData({ ...formData, shiftId: value })}
                >
                  <SelectTrigger id="shiftId">
                    <SelectValue placeholder="Select your shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pickup Location */}
              <div className="space-y-2">
                <Label htmlFor="pickupLocation" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pickup Location
                </Label>
                <Input
                  id="pickupLocation"
                  placeholder="Enter your pickup address"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
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
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
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
    </div>
  );
}
