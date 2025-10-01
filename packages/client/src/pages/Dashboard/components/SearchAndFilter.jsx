import { Search } from "lucide-react";
import { Input } from "@/components/Common/UI/Input";
import { Card, CardContent } from "@components/Common/UI/Card";
import PropTypes from "prop-types";

const SearchAndFilter = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <Card className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md shadow-lg border-0 rounded-xl overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search routes, stops, employees..."
            value={searchQuery}
            onChange={onSearchChange}
            className="pl-10 bg-white dark:bg-[#0c1222] border-0 focus:ring-2 focus:ring-[#4272FF] dark:focus:ring-[#4272FF] rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center justify-between p-1 bg-gray-100 dark:bg-[#1a2538] rounded-lg">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === "all"
                ? "bg-white dark:bg-[#0c1222] text-[#4272FF] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-[#4272FF]"
            }`}
          >
            All Routes
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-white dark:bg-[#0c1222] text-[#f3684e] dark:text-[#ff965b] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-[#f3684e] dark:hover:text-[#ff965b]"
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === "INACTIVE"
                ? "bg-white dark:bg-[#0c1222] text-gray-500 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            Inactive
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

SearchAndFilter.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
};

export default SearchAndFilter;
