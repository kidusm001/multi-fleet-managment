import PropTypes from "prop-types";
import { Briefcase, Users, MapPin, Activity } from "lucide-react";

import { StatsCard } from "./StatsCard";

export function StatsSection({ candidates, employees, getEmployeeStats }) {
  const stats = getEmployeeStats();

  return (
    <div className="bg-[var(--card-background)] rounded-2xl border border-[var(--divider)] shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">
        Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Candidates"
          value={candidates.length}
          change="+12"
          icon={<Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          iconBg="bg-indigo-100 dark:bg-indigo-500/20"
        />
        <StatsCard
          title="Total Employees"
          value={employees.length}
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
          title="Active Employees"
          value={stats.activeEmployees}
          icon={<Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          subtitle={`${Math.round((stats.activeEmployees / employees.length) * 100) || 0}% of total`}
        />
      </div>
    </div>
  );
}

StatsSection.propTypes = {
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      submittedAt: PropTypes.string,
      batchId: PropTypes.string,
    })
  ).isRequired,
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      shuttle: PropTypes.string,
    })
  ).isRequired,
  getEmployeeStats: PropTypes.func.isRequired,
};
