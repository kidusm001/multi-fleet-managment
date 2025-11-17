import { TrendingUp, Calendar, Banknote, Truck, X } from "lucide-react";
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
                icon={<Banknote className="h-4 w-4 text-muted-foreground" />}
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
  const grossAmount = shuttle.grossAmount || calculateMonthlyCost(shuttle);
  const bonuses = shuttle.bonuses || 0;
  const deductions = shuttle.deductions || 0;
  const netPay = shuttle.totalAmount || (grossAmount + bonuses - deductions);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        Payroll Breakdown for {shuttle.driver?.name || shuttle.id}
      </h3>
      
      {/* Status and Payment Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {shuttle.status || 'PENDING'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              Bank Transfer
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bank Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {shuttle.driver?.bankName || 'N/A'}<br />
              {shuttle.driver?.bankAccountNumber || 'Not specified'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-[var(--text-secondary)]">Gross Pay (Base + Overtime)</span>
              <span className="font-semibold">{formatCurrency(grossAmount)}</span>
            </div>
            {bonuses > 0 && (
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>+ Bonuses</span>
                <span className="font-semibold">{formatCurrency(bonuses)}</span>
              </div>
            )}
            {deductions > 0 && (
              <div className="flex justify-between py-2 border-b text-red-600">
                <span>- Deductions (Tax & Penalties)</span>
                <span className="font-semibold">-{formatCurrency(deductions)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-[var(--divider)]">
              <span className="text-lg font-bold">Net Pay</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(netPay)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Work Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Days Worked</span>
              <span className="font-semibold">{shuttle.usageDays || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Hours Worked</span>
              <span className="font-semibold">{shuttle.hoursWorked?.toFixed(1) || '0.0'} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Trips Completed</span>
              <span className="font-semibold">{shuttle.tripsCompleted || 0} trips</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Distance Covered</span>
              <span className="font-semibold">{shuttle.kmsCovered?.toFixed(1) || '0.0'} km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info if available */}
      {shuttle.driver && (
        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Name</span>
                <span className="font-semibold">{shuttle.driver.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Email</span>
                <span className="font-semibold">{shuttle.driver.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Base Salary</span>
                <span className="font-semibold">{formatCurrency(shuttle.driver.baseSalary || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Hourly Rate</span>
                <span className="font-semibold">{formatCurrency(shuttle.driver.hourlyRate || 0)}/hr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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

function CostBreakdownItem({ label, percentage: _percentage, cost }) {
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
