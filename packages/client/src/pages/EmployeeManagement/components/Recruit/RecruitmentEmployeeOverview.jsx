import PropTypes from "prop-types";
import { Users, Briefcase, TrendingUp, MapPin } from "lucide-react";

export function RecruitmentEmployeeOverview({ getEmployeeStats }) {
  return (
    <div className="bg-[var(--card-background)] rounded-xl p-6 border border-[var(--divider)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        Employee Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Total Employees
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {getEmployeeStats().total}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Assigned
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {getEmployeeStats().assigned}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Assignment Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {getEmployeeStats().assignedPercentage}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
              <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Top Location
              </p>
              <div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {getEmployeeStats().topLocationCount}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {getEmployeeStats().topLocation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

RecruitmentEmployeeOverview.propTypes = {
  getEmployeeStats: PropTypes.func.isRequired,
};