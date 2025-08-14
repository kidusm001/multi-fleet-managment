import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import Controls from "./Controls";
import DataSection from "./DataSection";
import { routeService } from "@/services/routeService";
import { shiftService } from "@/services/shiftService";
import { useToast } from "@/components/Common/UI/use-toast";
import Button from "@/components/Common/UI/Button";
import LoadingSpinner from "@/components/Common/UI/LoadingSpinner";

function RouteAssignment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routes, setRoutes] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch shifts on component mount
  useEffect(() => {
    async function fetchShifts() {
      try {
        const shiftsData = await shiftService.getAllShifts();
        setShifts(shiftsData);
      } catch (err) {
        console.error("Error fetching shifts:", err);
        toast({
          title: "Error",
          description: "Failed to load shifts. Please try again.",
          variant: "destructive",
        });
      }
    }

    fetchShifts();
  }, [toast]);

  // Fetch routes when shift is selected
  useEffect(() => {
    async function fetchRoutes() {
      if (!selectedShift) {
        setRoutes([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const routesData = await routeService.getRoutesByShift(selectedShift);
        setRoutes(routesData);
      } catch (err) {
        console.error("Error fetching routes:", err);
        setError("Failed to load routes. Please try again.");
        setRoutes([]);
        toast({
          title: "Error",
          description: "Failed to load routes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, [selectedShift, toast]);

  const handleCreateNewRoute = () => {
    navigate("/route-management/create", {
      state: { selectedShift },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-[1440px] mx-auto p-8">
        <div className="mb-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent tracking-tight mb-2">
                Route Assignment
              </h2>
              {selectedShift && selectedTime && (
                <p className="text-gray-600">
                  {shifts.find((s) => s.id === selectedShift)?.name} -{" "}
                  {selectedTime}
                </p>
              )}
            </div>
            {selectedShift && routes.length === 0 && !loading && (
              <Button
                onClick={handleCreateNewRoute}
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Route
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-[350px_1fr] gap-8 bg-white rounded-3xl shadow-sm p-8">
            <Controls
              selectedShift={selectedShift}
              setSelectedShift={setSelectedShift}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              routes={routes}
              shifts={shifts}
              loading={loading}
            />
            <DataSection
              selectedShift={selectedShift}
              selectedTime={selectedTime}
              selectedRoute={selectedRoute}
              routes={routes}
              loading={loading}
              onRouteUpdate={(updatedRoute) => {
                setRoutes(
                  routes.map((r) =>
                    r.id === updatedRoute.id ? updatedRoute : r
                  )
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteAssignment;
