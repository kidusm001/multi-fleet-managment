import { Card, CardContent } from "@components/Common/UI/Card";
import PropTypes from "prop-types";

const StatsCards = ({ stats }) => {
  return (
    <div className="p-4 md:p-6 pointer-events-auto">
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md shadow-lg border-0 rounded-xl overflow-hidden hover:shadow-[#4272FF]/10 hover:shadow-2xl transition-shadow duration-300"
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {stat.title}
                  </p>
                  <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-[#f3684e]/10 dark:bg-[#ff965b]/10 flex-shrink-0">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-2 md:mt-4 flex items-center">
                <span className="text-xs md:text-sm text-[#f3684e] dark:text-[#ff965b]">
                  {stat.change} today
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

StatsCards.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      change: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default StatsCards;
