import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Users, Clock, Truck, Calendar, TrendingUp, Activity, MapPin, BarChart3, UserCheck, Building, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/Common/UI/Badge';
import { cn } from '@lib/utils';

/**
 * StatsPanel Component
 * 
 * Displays key statistics and metrics about the routes, shifts, and employees
 * in a clean, informative panel with visual indicators.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.routes - Array of route data
 * @param {Array} props.shifts - Array of shift data
 * @param {Array} props.shuttles - Array of shuttle data
 */
const StatsPanel = ({ routes, shifts, shuttles }) => {
  // Calculate stats from provided data
  const totalEmployees = React.useMemo(() => 
    routes.reduce((total, route) => 
      total + route.stops.filter(stop => stop.employee).length, 0),
    [routes]
  );

  // Calculate total shifts and active shifts
  const shiftsStats = React.useMemo(() => {
    const totalShifts = shifts.length;
    const uniqueShiftsWithRoutes = new Set(
      routes
        .filter(route => route.shiftId)
        .map(route => route.shiftId)
    );
    const shiftsWithRoutes = uniqueShiftsWithRoutes.size;
    
    return {
      total: totalShifts,
      active: shiftsWithRoutes,
      percentage: totalShifts ? Math.round((shiftsWithRoutes / totalShifts) * 100) : 0
    };
  }, [routes, shifts]);
  
  // Calculate employee metrics by department
  const employeesByDepartment = React.useMemo(() => {
    const deptMap = {};
    let maxDept = { name: '', count: 0 };
    
    routes.forEach(route => {
      route.stops.forEach(stop => {
        if (stop.employee?.department) {
          const deptName = stop.employee.department.name;
          deptMap[deptName] = (deptMap[deptName] || 0) + 1;
          
          if (deptMap[deptName] > maxDept.count) {
            maxDept = { name: deptName, count: deptMap[deptName] };
          }
        }
      });
    });
    
    return {
      departments: Object.keys(deptMap).length,
      maxDepartment: maxDept
    };
  }, [routes]);
  
  const maxEmployeesPerShift = React.useMemo(() => {
    const employeesPerShift = {};
    let maxShift = { id: null, name: 'None', count: 0 };
    
    routes.forEach(route => {
      const shiftId = route.shiftId;
      if (!shiftId) return;
      
      if (!employeesPerShift[shiftId]) {
        employeesPerShift[shiftId] = {
          count: 0,
          name: route.shift?.name || `Shift #${shiftId}`
        };
      }
      
      const employeeCount = route.stops.filter(stop => stop.employee).length;
      employeesPerShift[shiftId].count += employeeCount;
      
      if (employeesPerShift[shiftId].count > maxShift.count) {
        maxShift = {
          id: shiftId,
          name: employeesPerShift[shiftId].name,
          count: employeesPerShift[shiftId].count
        };
      }
    });
    
    return maxShift;
  }, [routes]);
  
  const shuttleStats = React.useMemo(() => {
    if (!shuttles.length) return {
      utilization: 0,
      activeCount: 0,
      total: 0,
      maxCapacity: 0
    };
    
    const activeShuttleIds = new Set();
    let totalCapacity = 0;
    let maxCapacityShuttle = 0;
    
    routes.forEach(route => {
      if (route.status === 'active' && route.shuttleId) {
        activeShuttleIds.add(route.shuttleId);
        
        // Find shuttle capacity if available
        const shuttle = shuttles.find(s => s.id === route.shuttleId);
        if (shuttle?.capacity) {
          maxCapacityShuttle = Math.max(maxCapacityShuttle, shuttle.capacity);
          totalCapacity += shuttle.capacity;
        }
      }
    });
    
    const activeShuttles = activeShuttleIds.size;
    
    return {
      utilization: Math.round((activeShuttles / shuttles.length) * 100),
      activeCount: activeShuttles,
      total: shuttles.length,
      maxCapacity: maxCapacityShuttle
    };
  }, [routes, shuttles]);
  
  const routeMetrics = React.useMemo(() => {
    if (!routes.length) return {
      avgTime: 0,
      totalStops: 0,
      avgDistance: 0,
      totalDistance: 0
    };
    
    const totalTime = routes.reduce((sum, route) => sum + (route.totalTime || 0), 0);
    const totalStops = routes.reduce((sum, route) => sum + (route.stops?.length || 0), 0);
    const totalDistance = routes.reduce((sum, route) => sum + (route.totalDistance || 0), 0);
    
    return {
      avgTime: Math.round(totalTime / routes.length),
      totalStops,
      avgDistance: Math.round((totalDistance / routes.length) * 10) / 10,
      totalDistance: Math.round(totalDistance)
    };
  }, [routes]);

  // Animation variants for container and children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 120, damping: 12 }
    }
  };

  // Define stat cards with consistent styling patterns
  const statCards = [
    // Employees Card
    {
      title: "Employee Coverage",
      primaryValue: totalEmployees,
      primaryLabel: "total riders",
      icon: <Users className="h-5 w-5" />,
      iconColor: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-100/80 dark:bg-blue-900/30",
      details: [
        { 
          icon: <Building className="h-3.5 w-3.5" />, 
          text: `${employeesByDepartment.departments} departments` 
        },
        { 
          icon: <UserCheck className="h-3.5 w-3.5" />, 
          text: employeesByDepartment.maxDepartment.name ? 
            `${employeesByDepartment.maxDepartment.count} in ${employeesByDepartment.maxDepartment.name}` : 
            'No department data' 
        }
      ]
    },
    // Shift Coverage Card
    {
      title: "Shift Coverage",
      primaryValue: maxEmployeesPerShift.count,
      primaryLabel: "max per shift",
      icon: <Clock className="h-5 w-5" />,
      iconColor: "text-green-500 dark:text-green-400",
      iconBg: "bg-green-100/80 dark:bg-green-900/30",
      details: [
        { 
          icon: <CalendarClock className="h-3.5 w-3.5" />, 
          text: `${shiftsStats.active}/${shiftsStats.total} shifts used` 
        },
        { 
          icon: <Calendar className="h-3.5 w-3.5" />, 
          text: maxEmployeesPerShift.name || 'No data' 
        }
      ]
    },
    // Shuttle Utilization Card
    {
      title: "Shuttle Utilization",
      primaryValue: `${shuttleStats.utilization}%`,
      badge: {
        text: shuttleStats.utilization > 75 ? "High" : shuttleStats.utilization > 50 ? "Medium" : "Low",
        variant: shuttleStats.utilization > 75 ? "success" : shuttleStats.utilization > 50 ? "warning" : "default"
      },
      icon: <Truck className="h-5 w-5" />,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-100/80 dark:bg-amber-900/30",
      details: [
        { 
          icon: <Activity className="h-3.5 w-3.5" />, 
          text: `${shuttleStats.activeCount}/${shuttleStats.total} active` 
        },
        { 
          icon: <Users className="h-3.5 w-3.5" />, 
          text: `Max capacity: ${shuttleStats.maxCapacity}` 
        }
      ]
    },
    // Route Metrics Card
    {
      title: "Route Metrics",
      primaryValue: routeMetrics.avgTime,
      primaryLabel: "min avg",
      icon: <TrendingUp className="h-5 w-5" />,
      iconColor: "text-purple-500 dark:text-purple-400",
      iconBg: "bg-purple-100/80 dark:bg-purple-900/30",
      details: [
        { 
          icon: <MapPin className="h-3.5 w-3.5" />, 
          text: `${routeMetrics.totalStops} total stops` 
        },
        { 
          icon: <BarChart3 className="h-3.5 w-3.5" />, 
          text: `${routeMetrics.totalDistance} km total` 
        }
      ]
    }
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Map through the stat cards data to generate consistent UI */}
      {statCards.map((card, index) => (
        <motion.div 
          key={index}
          variants={cardVariants}
          className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border/40 shadow-sm 
                    hover:shadow-md hover:border-border/60 hover:bg-card/80 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            {/* Card title and primary metrics */}
            <div>
              {/* Title with improved typography */}
              <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground mb-1.5">{card.title}</p>
              
              <div className="flex items-baseline gap-1.5">
                {/* Primary metric with enhanced visual emphasis */}
                <p className="text-2xl font-bold text-card-foreground tracking-tight">{card.primaryValue}</p>
                
                {/* Optional badge or label */}
                {card.primaryLabel && (
                  <span className="text-xs font-medium text-muted-foreground">{card.primaryLabel}</span>
                )}
                {card.badge && (
                  <Badge variant={card.badge.variant} className="text-[10px] font-medium py-0.5">
                    {card.badge.text}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Icon with enhanced visual treatment */}
            <div className={cn("h-9 w-9 rounded-md flex items-center justify-center", card.iconBg)}>
              <div className={card.iconColor}>
                {card.icon}
              </div>
            </div>
          </div>
          
          {/* Detail metrics with improved layout and consistent styling */}
          <div className="grid grid-cols-2 gap-2 mt-1.5 relative">
            {/* Decorative connector line */}
            <div className="absolute h-[1px] w-full top-[14px] -left-1 right-0 bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>
            
            {/* Detail items */}
            {card.details.map((detail, detailIndex) => (
              <div key={detailIndex} className="flex items-center gap-1.5 pt-2">
                <span className="text-muted-foreground">{detail.icon}</span>
                <span className="text-xs text-muted-foreground font-medium truncate">{detail.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

StatsPanel.propTypes = {
  routes: PropTypes.array.isRequired,
  shifts: PropTypes.array.isRequired,
  shuttles: PropTypes.array.isRequired,
};

export default StatsPanel;