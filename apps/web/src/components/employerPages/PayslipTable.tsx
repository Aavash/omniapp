import React, { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart2,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, addDays, parseISO } from "date-fns";
import { fetchApi } from "@/utils/fetchInterceptor";
import { Skeleton } from "@/components/ui/skeleton";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from "recharts";

// Extend jsPDF with autoTable plugin
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface UserOptions {
  head: string[][];
  body: (string | number)[][];
  startY?: number;
  theme?: string;
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
  };
  styles?: {
    cellPadding?: number;
    fontSize?: number;
    textColor?: number[];
  };
  columnStyles?: {
    [key: number]: {
      halign?: string;
      fontStyle?: string;
    };
  };
}

// Generate random avatar colors and initials
const COLORS = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
                '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D'];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

interface Payslip {
  employee_id: number;
  organization_id: number;
  period_start: string;
  period_end: string;
  total_scheduled_hours: number;
  total_worked_hours: number;
  total_overtime_hours: number;
  gross_income: number;
  federal_tax: number;
  provincial_tax: number;
  cpp_contributions: number;
  ei_premiums: number;
  net_pay: number;
  employee_name: string;
  employee_avatar?: string;
  payrate: number;
  pay_type: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card>
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Info className="h-12 w-12 text-destructive" />
              <h3 className="text-lg font-medium">Error in Payslip Table</h3>
              <p className="text-sm text-muted-foreground text-center">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button variant="outline" onClick={this.resetError}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

const getBiweeklyRange = (date: Date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  
  return {
    start,
    end,
    apiStart: format(start, "yyyy-MM-dd"),
    apiEnd: format(end, "yyyy-MM-dd"),
    display: `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  };
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

function PayslipDetails({ payslip }: { payslip: Payslip }) {
  // Use hourly_rate from API response
  const payrate = payslip.hourly_rate || 0;
  const overtimeRate = payrate * 1.5;
  const regularHours = payslip.total_worked_hours - payslip.total_overtime_hours;
  const overtimeHours = payslip.total_overtime_hours;
  
  // Use values from API (regular_pay and overtime_pay)
  const regularPay = payslip.regular_pay || regularHours * payrate;
  const overtimePay = payslip.overtime_pay || overtimeHours * overtimeRate;
  const totalEarnings = regularPay + overtimePay;
  
  const totalDeductions = payslip.federal_tax + payslip.provincial_tax + 
                         payslip.cpp_contributions + payslip.ei_premiums;

  return (
    <div className="p-6 grid md:grid-cols-2 gap-6 animate-fade-in">
      {/* Left Column - Hours & Earnings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Hours & Earnings
          </h4>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            {payslip.pay_type}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Pay Rates */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Pay Rates</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-xs">
                <p className="text-sm text-gray-500 dark:text-gray-400">Regular Rate</p>
                <p className="text-lg font-semibold">${payrate.toFixed(2)}/h</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-xs">
                <p className="text-sm text-gray-500 dark:text-gray-400">Overtime Rate</p>
                <p className="text-lg font-semibold">${overtimeRate.toFixed(2)}/h</p>
              </div>
            </div>
          </div>

          {/* Hours Breakdown */}
          <div className="border rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hours Breakdown</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
                <span className="font-medium">{payslip.total_scheduled_hours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Regular Worked</span>
                <span className="font-medium">{regularHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Overtime Worked</span>
                <span className="font-medium text-orange-500">{overtimeHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-medium">
                <span>Total Worked</span>
                <span>{payslip.total_worked_hours.toFixed(1)}h</span>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Earnings</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Regular Pay</span>
                <span className="font-medium">${regularPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Overtime Pay</span>
                <span className="font-medium">${overtimePay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-green-600 dark:text-green-400">
                <span>Total Earnings</span>
                <span>${totalEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Deductions & Net Pay */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-500" />
            Deductions & Net Pay
          </h4>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Pay Period
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Deductions */}
          <div className="border rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Deductions</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Federal Tax</span>
                <span className="font-medium">${payslip.federal_tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Provincial Tax</span>
                <span className="font-medium">${payslip.provincial_tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CPP Contributions</span>
                <span className="font-medium">${payslip.cpp_contributions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">EI Premiums</span>
                <span className="font-medium">${payslip.ei_premiums.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-red-600 dark:text-red-400">
                <span>Total Deductions</span>
                <span>${totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay Calculation */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Net Pay Calculation</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Gross Earnings</span>
                <span className="font-medium">${payslip.gross_income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Deductions</span>
                <span className="font-medium text-red-500">-${totalDeductions.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-green-600 dark:text-green-400">
                <span>Net Pay</span>
                <span>${payslip.net_pay.toFixed(2)}</span>
              </div>
              </div>
            </div>
          </div>

          {/* Pay Period Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Pay period: {format(parseISO(payslip.period_start), "MMM d")} - {format(parseISO(payslip.period_end), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayslipSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PayslipError({ onRetry, error }: { onRetry: () => void; error?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payslips</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Info className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-medium">Failed to load payslips</h3>
          {error && (
            <p className="text-sm text-muted-foreground text-center">
              Error: {error}
            </p>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Please check your connection and try again.
          </p>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PayslipTableCore({ organizationId }: { organizationId: number }) {
  const [dateRange, setDateRange] = useState(() => getBiweeklyRange(new Date()));
  const [expandedSlips, setExpandedSlips] = useState<Record<number, boolean>>({});

  const { data: payslips, isLoading, isError, error, refetch } = useQuery<Payslip[], Error>({
    queryKey: ["payslips", organizationId, dateRange.apiStart, dateRange.apiEnd],
    queryFn: async () => {
      try {
        const response = await fetchApi(
          `/api/payslip/biweekly?organization_id=${organizationId}&period_start=${dateRange.apiStart}&period_end=${dateRange.apiEnd}`
        );
        
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from server');
        }
        
        return data.map(payslip => ({
          ...payslip,
          employee_name: payslip.employee_name || `Employee ${payslip.employee_id}`,
          employee_avatar: payslip.employee_avatar || undefined
        }));
        
      } catch (err) {
        console.error('Failed to fetch payslips:', err);
        throw err;
      }
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
    useErrorBoundary: true
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!payslips) return null;
    
    const totalEmployees = payslips.length;
    const totalHours = payslips.reduce((sum, p) => sum + p.total_worked_hours, 0);
    const totalPayroll = payslips.reduce((sum, p) => sum + p.gross_income, 0);
    const avgPay = totalPayroll / totalEmployees;
    const overtimeHours = payslips.reduce((sum, p) => sum + p.total_overtime_hours, 0);
    
    return {
      totalEmployees,
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalPayroll: parseFloat(totalPayroll.toFixed(2)),
      avgPay: parseFloat(avgPay.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(1))
    };
  }, [payslips]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!payslips) return [];
    
    return payslips.map(p => ({
      name: p.employee_name.split(' ')[0],
      gross: p.gross_income,
      net: p.net_pay,
      deductions: p.gross_income - p.net_pay
    })).sort((a, b) => b.gross - a.gross);
  }, [payslips]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedSlips(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const navigatePeriod = useCallback((direction: "previous" | "next") => {
    const newDate = direction === "previous" 
      ? subDays(dateRange.start, 14) 
      : addDays(dateRange.start, 14);
    setDateRange(getBiweeklyRange(newDate));
  }, [dateRange.start]);

  const generatePayslipPDF = (payslip: Payslip) => {
    try {
      const doc = new jsPDF();
      
      // Calculate rates and payments
      const hourlyRate = payslip.hourly_rate || 0;
      const overtimeRate = hourlyRate * 1.5;
      const regularHours = (payslip.total_worked_hours || 0) - (payslip.total_overtime_hours || 0);
      const overtimeHours = payslip.total_overtime_hours || 0;
      
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const totalDeductions = (payslip.federal_tax || 0) + 
                            (payslip.provincial_tax || 0) + 
                            (payslip.cpp_contributions || 0) + 
                            (payslip.ei_premiums || 0);
  
      // Add document metadata
      doc.setProperties({
        title: `Payslip - ${payslip.employee_name}`,
        subject: `Pay period ${format(parseISO(payslip.period_start), "MMM d")} to ${format(parseISO(payslip.period_end), "MMM d, yyyy")}`,
        creator: 'Your Company Name'
      });
  
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
        
      doc.setFontSize(16);
      doc.text('PAYSLIP', 105, 30, { align: 'center' });
  
      // Pay period
      doc.setFontSize(12);
      doc.text(
        `Pay Period: ${format(parseISO(payslip.period_start), "MMM d, yyyy")} - ${format(parseISO(payslip.period_end), "MMM d, yyyy")}`,
        14,
        50
      );
  
      // Employee information
      autoTable(doc, {
        startY: 60,
        head: [['Employee Information', '']],
        body: [
          ['Employee Name', payslip.employee_name || ''],
          ['Hourly Rate', `$${hourlyRate.toFixed(2)}`],
                           ],
        theme: 'plain',
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
        styles: { cellPadding: 5 }
      });
  
      // Earnings section
      autoTable(doc, {
        startY: 110,
        head: [['Earnings', 'Hours', 'Rate', 'Amount']],
        body: [
          [
            'Regular Pay',
            regularHours.toFixed(1),
            `$${hourlyRate.toFixed(2)}`,
            `$${regularPay.toFixed(2)}`
          ],
          [
            'Overtime Pay',
            overtimeHours.toFixed(1),
            `$${overtimeRate.toFixed(2)}`,
            `$${overtimePay.toFixed(2)}`
          ],
          ['Total Earnings', '', '', `$${(regularPay + overtimePay).toFixed(2)}`]
        ],
        columnStyles: {
          3: { halign: 'right' }
        },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { cellPadding: 5 }
      });
  
      // Deductions section
      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY || 150,
        head: [['Deductions', 'Amount']],
        body: [
          ['Federal Tax', `$${(payslip.federal_tax || 0).toFixed(2)}`],
          ['Provincial Tax', `$${(payslip.provincial_tax || 0).toFixed(2)}`],
          ['CPP Contributions', `$${(payslip.cpp_contributions || 0).toFixed(2)}`],
          ['EI Premiums', `$${(payslip.ei_premiums || 0).toFixed(2)}`],
          ['Total Deductions', `$${totalDeductions.toFixed(2)}`]
        ],
        columnStyles: {
          1: { halign: 'right' }
        },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { cellPadding: 5 }
      });
  
      // Net pay section
      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 190) + 10,
        body: [
          ['Net Pay', `$${(payslip.net_pay || 0).toFixed(2)}`]
        ],
        columnStyles: {
          1: { halign: 'right', fontStyle: 'bold' }
        },
        styles: { 
          cellPadding: 5,
          fontSize: 14,
          textColor: [0, 100, 0]
        }
      });
  
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for your hard work!', 105, 280, { align: 'center' });
      doc.text('Generated on: ' + format(new Date(), "MMM d, yyyy h:mm a"), 105, 285, { align: 'center' });
  
      // Save the PDF
      const fileName = `payslip-${(payslip.employee_name || 'employee').replace(/\s+/g, '-')}-${format(parseISO(payslip.period_start), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate payslip PDF');
    }
  };

  const handleDownload = async (payslip: Payslip) => {
    try {
      await generatePayslipPDF(payslip);
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate payslip');
    }
  };

  const getPaymentStatus = (periodEnd: string) => {
    const endDate = new Date(periodEnd);
    const today = new Date();
    return endDate < today ? { status: "Paid", variant: "default" } : { status: "Pending", variant: "secondary" };
  };

  if (isLoading) return <PayslipSkeleton />;
  if (isError) return <PayslipError onRetry={() => refetch()} error={error?.message} />;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Employees"
          value={stats?.totalEmployees.toString() || '0'}
          icon={Users}
          description="Active this period"
        />
        <StatsCard
          title="Total Hours"
          value={stats?.totalHours.toString() || '0'}
          icon={Clock}
          description={`${stats?.overtimeHours || 0} overtime hours`}
          trend="up"
        />
        <StatsCard
          title="Total Payroll"
          value={`$${stats?.totalPayroll.toLocaleString() || '0'}`}
          icon={DollarSign}
          description={`Avg $${stats?.avgPay.toLocaleString() || '0'}`}
        />
        <StatsCard
          title="Payroll Distribution"
          value={`${payslips?.length || 0} payslips`}
          icon={BarChart2}
          description={dateRange.display}
        />
      </div>

      {/* Pay Distribution Chart */}
      <Card className="shadow-sm">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg font-semibold flex items-center gap-2">
      <DollarSign className="h-5 w-5 text-primary" />
      Employee Gross Pay
    </CardTitle>
    <CardDescription className="flex items-center gap-2">
      <Info className="h-4 w-4 text-muted-foreground" />
      Top 15 employees for {dateRange.display}
    </CardDescription>
  </CardHeader>
  <CardContent className="h-[380px] pl-2"> {/* Reduced height */}
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={chartData.slice(0, 15)}
        margin={{
          top: 12,    // Reduced margins
          right: 100, 
          left: 80,   // Reduced left margin
          bottom: 12, // Reduced bottom margin
        }}
        barSize={24}  // Slimmer bars
        barCategoryGap={10} // Tighter gap
      >
        <CartesianGrid 
          strokeDasharray="2 2"  // Lighter grid
          horizontal={false} 
          stroke="hsl(var(--border))"
        />
        <XAxis 
          type="number" 
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          tick={{ 
            fill: "hsl(var(--muted-foreground))",
            fontSize: 11 // Smaller font
          }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickMargin={8}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={70} // Reduced width
          tick={{ 
            fontSize: 11, // Smaller font
            fill: "hsl(var(--foreground))" 
          }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
          tickFormatter={(value) => {
            const parts = value.split(' ');
            return parts.length > 1 
              ? `${parts[0][0]}.${parts[1][0]}` // More compact initials
              : value.length > 8
                ? `${value.substring(0, 6)}...`
                : value;
          }}
        />
        <ChartTooltip 
          content={({ payload, label }) => (
            <div className="bg-background p-3 border rounded-lg shadow-sm text-sm">
              <p className="font-medium">{label}</p>
              {payload?.map((entry, index) => (
                <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Gross:</span>
                  <span className="font-semibold">
                    ${entry.value?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        />
        <Bar 
          dataKey="gross" 
          name="Gross Pay"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
          animationDuration={1200} // Faster animation
          label={{
            position: 'right',
            formatter: (value) => `$${value.toLocaleString()}`,
            fill: "hsl(var(--foreground))",
            fontSize: 11, // Smaller label
            fontWeight: 500,
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
  <CardFooter className="pt-0">
    <div className="flex items-center gap-2 text-xs text-muted-foreground"> {/* Smaller footer */}
      <Badge variant="outline" className="px-2 py-1 text-xs">
        Total: ${stats?.totalPayroll.toLocaleString() || '0'}
      </Badge>
      <Badge variant="outline" className="px-2 py-1 text-xs">
        Avg: ${stats?.avgPay.toLocaleString() || '0'}
      </Badge>
    </div>
  </CardFooter>
</Card>

      {/* Payslip Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Payroll Period</CardTitle>
              <CardDescription className="mt-1">
                {dateRange.display}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigatePeriod("previous")}
                disabled={isLoading}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigatePeriod("next")}
                disabled={dateRange.end >= new Date() || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Hours Worked</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips?.length ? (
                payslips.map((payslip) => (
                  <React.Fragment key={payslip.employee_id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8" style={{ backgroundColor: getRandomColor() }}>
                            <AvatarImage src={payslip.employee_avatar} alt={payslip.employee_name} />
                            <AvatarFallback>
                              {getInitials(payslip.employee_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{payslip.employee_name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {payslip.employee_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(payslip.period_start), "MMM d")} -{" "}
                        {format(parseISO(payslip.period_end), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {payslip.total_worked_hours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${payslip.gross_income.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Badge variant="outline" className="px-2 py-1">
                          ${payslip.net_pay.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">
                          {getPaymentStatus(payslip.period_end).status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleExpand(payslip.employee_id)}
                                aria-label={expandedSlips[payslip.employee_id] ? "Collapse details" : "Expand details"}
                              >
                                {expandedSlips[payslip.employee_id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {expandedSlips[payslip.employee_id] ? "Collapse" : "Expand"} details
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleDownload(payslip)}
                                aria-label="Download payslip"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download payslip</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedSlips[payslip.employee_id] && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-0">
                          <PayslipDetails payslip={payslip} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No payslips found for this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="border-t py-3">
          <div className="text-sm text-muted-foreground">
            Showing {payslips?.length || 0} payslips
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function PayslipTable({ organizationId }: { organizationId: number }) {
  return (
    <ErrorBoundary
      fallback={
        <PayslipError 
          onRetry={() => window.location.reload()} 
          error="Component crashed"
        />
      }
    >
      <PayslipTableCore organizationId={organizationId} />
    </ErrorBoundary>
  );
}

export default PayslipTable;