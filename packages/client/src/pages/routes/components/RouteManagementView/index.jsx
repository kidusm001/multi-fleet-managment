import { useEffect, useMemo, useState } from "react";
import { routeService } from "@services/routeService";
import Header from "./components/Header";
import SearchAndFilterBar from "./components/SearchAndFilterBar";
import StatsPanel from "./components/StatsPanel";
import RouteTable from "./components/RouteTable";
import RouteDetailDrawer from "./components/RouteDetailDrawer";
import PropTypes from "prop-types";

function RouteManagementView({ refreshTrigger }) {
  const [routes, setRoutes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [filters, setFilters] = useState({ status: "all", shuttle: "all", department: "all", shift: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    void load();
  }, [refreshTrigger]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await routeService.list(false);
      setRoutes(data);
      setFiltered(data);
    } catch (e) {
      setError("Failed to fetch routes");
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => routes, [routes]);
  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let list = data;
    if (needle) {
      list = list.filter(
        (r) => String(r.id).toLowerCase().includes(needle) || (r.name || "").toLowerCase().includes(needle)
      );
    }
    // TODO: apply filters.status/shuttle/department/shift when services are wired
    setFiltered(list);
  }, [q, data, filters]);

  if (loading) return <div className="p-6">Loading routes…</div>;
  if (error)
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={load} className="px-3 py-2 rounded-md border">
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Header
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          showItemsPerPageSelector
        />
        <button onClick={load} className="px-3 py-2 rounded-md border">Refresh</button>
      </div>

      <SearchAndFilterBar
        searchQuery={q}
        onSearchChange={setQ}
        filterStatus={filters.status}
        onStatusChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        filterShuttle={filters.shuttle}
        onShuttleChange={(v) => setFilters((f) => ({ ...f, shuttle: v }))}
        filterDepartment={filters.department}
        onDepartmentChange={(v) => setFilters((f) => ({ ...f, department: v }))}
        filterShift={filters.shift}
        onShiftChange={(v) => setFilters((f) => ({ ...f, shift: v }))}
        shuttles={[]}
        departments={[]}
        shifts={[]}
      />

      <StatsPanel routes={filtered} shifts={[]} shuttles={[]} />

      <RouteTable
        routes={filtered}
        onRouteClick={setSelectedRoute}
        onExportClick={() => {}}
      />

      {selectedRoute && (
        <RouteDetailDrawer route={selectedRoute} onClose={() => setSelectedRoute(null)} />
      )}
    </div>
  );
}

RouteManagementView.propTypes = {
  refreshTrigger: PropTypes.any,
};

export default RouteManagementView;
