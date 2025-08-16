import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/Common/UI/Button";
import { Card } from "@/components/Common/UI/Card";
import { cn } from "@/lib/utils";
import { shuttleService } from "@/services/shuttleService";
import { RefreshCw, Check, X, AlertCircle } from "lucide-react";

export default function PendingShuttleRequestsTable({ onRequestStatusChanged }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [currentRejectId, setCurrentRejectId] = useState(null);
  const modalRef = useRef(null);
  const commentInputRef = useRef(null);

  const fetchPendingRequests = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await shuttleService.getPendingShuttleRequests();
      setPendingRequests(data);
    } catch (err) {
      setError("Failed to load pending requests");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    // Removed the polling interval that disrupts user experience
  }, []);

  useEffect(() => {
    if (rejectModalOpen) {
      document.body.style.overflow = "hidden";
      // Focus the comment input when modal opens
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 100);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [rejectModalOpen]);

  useEffect(() => {
    if (rejectModalOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [rejectModalOpen]);

  const handleRefresh = () => {
    fetchPendingRequests(true);
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await shuttleService.approveShuttleRequest(id);
      await fetchPendingRequests();
      // Trigger the callback to refresh the main shuttle table
      if (onRequestStatusChanged) {
        onRequestStatusChanged();
      }
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const openRejectModal = (id) => {
    setCurrentRejectId(id);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectComment.trim()) {
      alert("Please enter a rejection comment.");
      return;
    }
    setActionLoading((prev) => ({ ...prev, [currentRejectId]: true }));
    try {
      await shuttleService.rejectShuttleRequest(currentRejectId, rejectComment);
      await fetchPendingRequests();
      // Trigger the callback to refresh the main shuttle table
      if (onRequestStatusChanged) {
        onRequestStatusChanged();
      }
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [currentRejectId]: false }));
      setRejectModalOpen(false);
      setCurrentRejectId(null);
      setRejectComment("");
    }
  };

  // Handle ESC key to close modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setRejectModalOpen(false);
    } else if (e.key === 'Enter' && e.ctrlKey) {
      confirmReject();
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
        Loading pending shuttle requests...
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
    <>
      <Card className="mt-6 overflow-x-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Pending Shuttle Requests
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
            No pending shuttle requests.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">License Plate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {pendingRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{request.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{request.licensePlate}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{request.model}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center flex justify-center space-x-2">
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
                      onClick={() => openRejectModal(request.id)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Enhanced Rejection Modal */}
      {rejectModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full mr-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reject Shuttle Request
              </h3>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Please provide a reason for rejection:
              </label>
              <textarea
                ref={commentInputRef}
                className={cn(
                  "w-full p-3 border rounded-lg resize-none min-h-[100px]",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "border-gray-300 focus:border-blue-500 dark:border-gray-700",
                  "bg-white dark:bg-gray-900",
                  "text-gray-900 dark:text-gray-100",
                  "focus:ring-blue-500 dark:focus:ring-blue-600"
                )}
                placeholder="Enter reason for rejection..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This message will be sent to the requester.
              </p>
            </div>
            
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                className={cn(
                  "border-gray-300 hover:bg-gray-50 dark:border-gray-700",
                  "dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                  "focus:outline-none focus:ring-2 focus:ring-gray-400",
                  "dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                )}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmReject}
                className={cn(
                  "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
                  "text-white shadow-sm hover:shadow transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-red-500",
                  "focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                )}
              >
                Confirm Reject
              </Button>
            </div>
            <div className="px-5 py-2 text-center border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Escape</kbd> to cancel or <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> to confirm
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}