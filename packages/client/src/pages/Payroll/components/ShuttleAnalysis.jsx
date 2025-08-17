import { TrendingUp, Calendar, DollarSign, Truck, X } from "lucide-react";
import PropTypes from "prop-types";
import { formatCurrency } from "@/utils/formatters";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Common/UI/Card";
import { Button } from "@/components/Common/UI/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/Common/UI/Tabs";
import { Progress } from "@/components/Common/UI/Progress";

export function ShuttleAnalysis({
  selectedShuttle,
  calculateMonthlyCost,
  onClose,
}) {
  return (
    <Card className="bg-[var(--card-background)] border-[var(--divider)] rounded-xl shadow-md mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[var(--text-primary)]">Shuttle Analysis: {selectedShuttle.id}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payroll">Payroll Analysis</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency Trends</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <OverviewCard
                title="Monthly Cost"
                value={formatCurrency(calculateMonthlyCost(selectedShuttle))}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              />
              <OverviewCard
                title="Usage (Days)"
                value={`${selectedShuttle.usageDays} days`}
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              />
              <OverviewCard
                title="Efficiency"
                value={`${selectedShuttle.efficiency}%`}
                icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              />
              <OverviewCard
                title="Model"
                value={selectedShuttle.model}
                icon={<Truck className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          </TabsContent>
          <TabsContent value="payroll">
            <PayrollAnalysis
              shuttle={selectedShuttle}
              calculateMonthlyCost={calculateMonthlyCost}
            />
          </TabsContent>
          <TabsContent value="efficiency">
            <EfficiencyAnalysis shuttle={selectedShuttle} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function OverviewCard({ title, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function PayrollAnalysis({ shuttle, calculateMonthlyCost }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Payroll Analysis for {shuttle.id}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(shuttle.costPerDay)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateMonthlyCost(shuttle))}
            </div>
          </CardContent>
        </Card>
      </div>
      <CostBreakdown shuttle={shuttle} />
    </div>
  );
}

function CostBreakdown({ shuttle }) {
  const costBreakdown = [
    {
      label: "Base Cost",
      percentage: 0.65,
      cost: shuttle.costPerDay * 0.65
    },
    {
      label: "Maintenance",
      percentage: 0.20,
      cost: shuttle.type === 'Owned' ? 450 : 550 // Updated maintenance cost in ETB
    },
    {
      label: "Insurance",
      percentage: 0.10,
      cost: (shuttle.type === 'Owned' ? 5000 : 6000) / 22 // Monthly insurance in ETB divided by working days
    },
    {
      label: "Other Expenses",
      percentage: 0.05,
      cost: shuttle.costPerDay * 0.05
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {costBreakdown.map((item, index) => (
            <CostBreakdownItem
              key={index}
              label={item.label}
              cost={item.cost}
              percentage={item.percentage}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CostBreakdownItem({ label, percentage, cost }) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span>{formatCurrency(cost)}/day</span>
    </div>
  );
}

function EfficiencyAnalysis({ shuttle }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Efficiency Analysis for {shuttle.id}
      </h3>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold mr-2">{shuttle.efficiency}%</div>
            <Progress value={shuttle.efficiency} className="flex-1" />
          </div>
        </CardContent>
      </Card>
      <EfficiencyFactors shuttle={shuttle} />
    </div>
  );
}

function EfficiencyFactors({ shuttle }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Efficiency Factors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <EfficiencyFactor
            label="Fuel Efficiency"
            value={shuttle.efficiency + 5}
          />
          <EfficiencyFactor
            label="Maintenance Efficiency"
            value={shuttle.efficiency - 3}
          />
          <EfficiencyFactor
            label="Route Optimization"
            value={shuttle.efficiency + 2}
          />
          <EfficiencyFactor
            label="Driver Performance"
            value={shuttle.efficiency - 1}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EfficiencyFactor({ label, value }) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span>{value}%</span>
    </div>
  );
}

ShuttleAnalysis.propTypes = {
  selectedShuttle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    usageDays: PropTypes.number.isRequired,
    costPerDay: PropTypes.number.isRequired,
    efficiency: PropTypes.number.isRequired,
  }).isRequired,
  calculateMonthlyCost: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

OverviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};

PayrollAnalysis.propTypes = {
  shuttle: PropTypes.object.isRequired,
  calculateMonthlyCost: PropTypes.func.isRequired,
};

CostBreakdown.propTypes = {
  shuttle: PropTypes.object.isRequired,
};

CostBreakdownItem.propTypes = {
  label: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
  cost: PropTypes.number.isRequired,
};

EfficiencyAnalysis.propTypes = {
  shuttle: PropTypes.object.isRequired,
};

EfficiencyFactors.propTypes = {
  shuttle: PropTypes.object.isRequired,
};

EfficiencyFactor.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};
