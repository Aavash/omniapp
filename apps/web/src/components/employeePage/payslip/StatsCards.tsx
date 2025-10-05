// components/payslip/StatsCards.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Payslip, YTDSummary } from "@/types/payslip";

export const PayslipStatsCards = ({
  currentPayslip,
  payslipHistory,
  ytdSummary,
}: {
  currentPayslip: Payslip;
  payslipHistory: Payslip[];
  ytdSummary: YTDSummary;
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Current Pay"
        value={formatCurrency(currentPayslip.net_pay)}
        icon={DollarSign}
        description="Net pay this period"
        trend="up"
      />
      <StatsCard
        title="YTD Earnings"
        value={formatCurrency(ytdSummary.total_gross_income)}
        icon={DollarSign}
        description={`${formatCurrency(ytdSummary.total_taxes)} taxes`}
      />
      <StatsCard
        title="YTD Hours"
        value={payslipHistory.reduce((sum, p) => sum + p.total_worked_hours, 0).toFixed(1)}
        icon={Clock}
        description={`${payslipHistory.reduce((sum, p) => sum + p.total_overtime_hours, 0).toFixed(1)} overtime`}
      />
      <StatsCard
        title="Hourly Rate"
        value={formatCurrency(currentPayslip.hourly_rate)}
        icon={TrendingUp}
        description="Current pay rate"
      />
    </div>
  );
};

function StatsCard({ 
  title, 
  value, 
  icon: Icon,
  description,
  trend
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}