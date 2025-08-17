import { Card, CardContent } from "@components/Common/UI/Card";
import PropTypes from "prop-types";

const StatsCards = ({ stats }) => {
  return (
    <div className="p-6 pointer-events-auto">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md shadow-lg border-0 rounded-xl overflow-hidden hover:shadow-[#4272FF]/10 hover:shadow-2xl transition-shadow duration-300"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#f3684e]/10 dark:bg-[#ff965b]/10">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-[#f3684e] dark:text-[#ff965b]">
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
