import PropTypes from "prop-types";
import { Users, MapPin, Activity } from "lucide-react";

import { StatsCard } from "./StatsCard";

export function StatsSection({ getEmployeeStats }) {
  const stats = getEmployeeStats();

  return (
    <div className="bg-[var(--card-background)] rounded-2xl border border-[var(--divider)] shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">
        Overview
      </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Employees"
          value={stats.activeEmployees}
          change="-5"
          icon={<Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
          iconBg="bg-sky-100 dark:bg-sky-500/20"
        />
        <StatsCard
          title="Active Locations"
          value={stats.topLocationCount}
          change="+8"
          icon={<MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          subtitle={`Most active: ${stats.topLocation}`}
        />
        <StatsCard
          title="Assigned Employees"
          value={stats.assigned}
          icon={<Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          subtitle={`${stats.assignedPercentage}% of total`}
        />
      </div>
    </div>
  );
}

StatsSection.propTypes = {
  getEmployeeStats: PropTypes.func.isRequired,
};
