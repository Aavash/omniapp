// components/payslip/ChartsSection.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Payslip } from "@/types/payslip";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ChartsSectionProps {
  yearlyData: any[];
  biweeklyDistribution: any[];
  deductionData: any[];
  currentPayslip: Payslip;
}

export const PayslipChartsSection = ({
  yearlyData,
  biweeklyDistribution,
  deductionData,
  currentPayslip
}: ChartsSectionProps) => {
  return (
    <div className="space-y-6">
      <YearlyEarningsChart data={yearlyData} />
      <BiweeklyDistributionChart data={biweeklyDistribution} />
      <DeductionsBreakdownChart 
        data={deductionData} 
        currentPayslip={currentPayslip} 
      />
    </div>
  );
};

interface ChartDataProps {
  data: any[];
}

const YearlyEarningsChart = ({ data }: ChartDataProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Yearly Earnings Overview</CardTitle>
      <CardDescription>Your earnings and hours worked by year</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <ChartTooltip
              formatter={(value: number, name: string) => 
                name === 'Hours' ? [`${value} hours`, name] : [formatCurrency(value), name]
              }
            />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="gross" 
              name="Gross Income" 
              fill="#8884d8" 
            />
            <Bar 
              yAxisId="left" 
              dataKey="net" 
              name="Net Pay" 
              fill="#82ca9d" 
            />
            <Bar 
              yAxisId="right" 
              dataKey="hours" 
              name="Hours Worked" 
              fill="#FFBB28" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const BiweeklyDistributionChart = ({ data }: ChartDataProps) => {
  // Safely transform data with error handling
  const chartData = data.map(period => {
    // Handle missing or invalid period data
    if (!period?.period_start || !period?.period_end) {
      console.warn('Invalid period data:', period);
      return {
        ...period,
        deductions: period.gross - period.net,
        periodLabel: 'Invalid Date Range',
        hourlyRate: period.hours > 0 ? (period.gross / period.hours).toFixed(2) : 0
      };
    }

    try {
      return {
        ...period,
        deductions: period.gross - period.net,
        periodLabel: formatPeriod(period.period_start, period.period_end),
        hourlyRate: period.hours > 0 ? (period.gross / period.hours).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error formatting period:', error);
      return {
        ...period,
        deductions: period.gross - period.net,
        periodLabel: 'Invalid Date',
        hourlyRate: period.hours > 0 ? (period.gross / period.hours).toFixed(2) : 0
      };
    }
  });

  function formatPeriod(start: string, end: string) {
    try {
      // Handle cases where dates might be in different formats
      const startDate = typeof start === 'string' ? parseISO(start) : new Date(start);
      const endDate = typeof end === 'string' ? parseISO(end) : new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return `${start} - ${end}`; // Fallback to raw values
    }
  }

  // Filter out invalid data if needed
  const validData = chartData.filter(item => item.periodLabel !== 'Invalid Date Range');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biweekly Pay Distribution</CardTitle>
        <CardDescription>
          {validData.length !== chartData.length 
            ? `${validData.length} of ${chartData.length} valid periods shown` 
            : 'Detailed breakdown of each pay period'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {validData.length > 0 ? (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={validData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 80 }}
                  barCategoryGap={15}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="periodLabel" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    formatter={(value: number, name: string) => [
                      name === 'hours' || name === 'hourlyRate' 
                        ? name === 'hours' 
                          ? `${value} hours` 
                          : `${formatCurrency(Number(value))}/hr`
                        : formatCurrency(value),
                      name === 'hourlyRate' ? 'Rate' : name
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      padding: '8px 12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '10px',
                      paddingBottom: '30px'
                    }}
                  />
                  
                  <Bar 
                    dataKey="gross" 
                    name="Gross Pay" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="deductions" 
                    name="Deductions" 
                    fill="#ef4444" 
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="net" 
                    name="Net Pay" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4 text-lg">Pay Period Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Period</th>
                      <th className="text-right p-3">Hours</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Gross</th>
                      <th className="text-right p-3">Deductions</th>
                      <th className="text-right p-3">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validData.map((period, index) => (
                      <tr 
                        key={index} 
                        className={index % 2 === 0 ? 'bg-muted/10' : 'bg-background'}
                      >
                        <td className="p-3">{period.periodLabel}</td>
                        <td className="text-right p-3">{period.hours.toFixed(1)}h</td>
                        <td className="text-right p-3">{formatCurrency(Number(period.hourlyRate))}/h</td>
                        <td className="text-right p-3">{formatCurrency(period.gross)}</td>
                        <td className="text-right p-3 text-destructive">
                          -{formatCurrency(period.deductions)}
                        </td>
                        <td className="text-right p-3 font-medium text-primary">
                          {formatCurrency(period.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <CalendarIcon className="h-8 w-8" />
            <p>No valid pay period data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DeductionsChartProps {
  data: {
    name: string;
    value: number;
  }[];
  currentPayslip: Payslip;
}

const DeductionsBreakdownChart = ({ data, currentPayslip }: DeductionsChartProps) => {
  const totalDeductions = currentPayslip.federal_tax + 
                         currentPayslip.provincial_tax + 
                         currentPayslip.cpp_contributions + 
                         currentPayslip.ei_premiums;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Payslip Deductions</CardTitle>
        <CardDescription>Breakdown of taxes and contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Current Pay Period</h4>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(currentPayslip.period_start), "MMM d, yyyy")} -{" "}
                {format(parseISO(currentPayslip.period_end), "MMM d, yyyy")}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Total Deductions</h4>
              <p className="text-2xl font-bold">
                {formatCurrency(totalDeductions)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Federal Tax</p>
                <p>{formatCurrency(currentPayslip.federal_tax)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Provincial Tax</p>
                <p>{formatCurrency(currentPayslip.provincial_tax)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CPP</p>
                <p>{formatCurrency(currentPayslip.cpp_contributions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">EI</p>
                <p>{formatCurrency(currentPayslip.ei_premiums)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};