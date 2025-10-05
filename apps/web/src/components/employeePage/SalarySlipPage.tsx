// app/employee/payslips/page.tsx
import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, addDays, parseISO } from "date-fns";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/utils/fetchInterceptor";
import { Payslip, YTDSummary } from "@/types/payslip";
import { PayslipStatsCards } from "./payslip/StatsCards";
import { PayslipChartsSection } from "./payslip/ChartsSection";
import { PayslipTabsSection } from "./payslip/TabsSection";
import { PayslipError } from "./payslip/PayslipError";
import { generatePayslipPDF } from "./payslip/PayslipPDFGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Info } from "lucide-react";

const EmployeePayslipView = () => {
  const [dateRange, setDateRange] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 13);
    return {
      start,
      end,
      apiStart: format(start, "yyyy-MM-dd"),
      apiEnd: format(end, "yyyy-MM-dd"),
      display: `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
    };
  });

  const [expandedSlips, setExpandedSlips] = useState<Record<number, boolean>>({});

  // Fetch current payslip
  const { 
    data: currentPayslip, 
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
    error: errorCurrent
  } = useQuery<Payslip>({
    queryKey: ["employee-payslip", dateRange.apiStart, dateRange.apiEnd],
    queryFn: async () => {
      const response = await fetchApi(
        `/api/employee/payslip/biweekly?period_start=${dateRange.apiStart}&period_end=${dateRange.apiEnd}`
      );
      if (!response.ok) throw new Error("Failed to fetch payslip");
      return response.json();
    }
  });

  // Fetch payslip history (without deduction details)
  const { 
    data: payslipHistory, 
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory
  } = useQuery<Payslip[]>({
    queryKey: ["employee-payslip-history"],
    queryFn: async () => {
      const response = await fetchApi("/api/employee/payslip/history?limit=6&basic=true");
      if (!response.ok) throw new Error("Failed to fetch payslip history");
      return response.json();
    }
  });

  // Fetch YTD summary
  const { 
    data: ytdSummary, 
    isLoading: isLoadingYTD,
    isError: isErrorYTD,
    error: errorYTD
  } = useQuery<YTDSummary>({
    queryKey: ["employee-payslip-ytd"],
    queryFn: async () => {
      const response = await fetchApi("/api/employee/payslip/year-to-date");
      if (!response.ok) throw new Error("Failed to fetch YTD summary");
      return response.json();
    }
  });

  // Process data for charts and tabs
  const recentPayslips = useMemo(() => {
    return payslipHistory?.slice(0, 3).map(payslip => ({
      ...payslip,
      // Remove detailed deduction data for recent payslips
      federal_tax: 0,
      provincial_tax: 0,
      cpp_contributions: 0,
      ei_premiums: 0
    })) || [];
  }, [payslipHistory]);

  const yearlyData = useMemo(() => {
    if (!payslipHistory) return [];
    
    const yearMap = new Map<number, {
      gross: number;
      net: number;
      hours: number;
      count: number;
    }>();
  
    payslipHistory.forEach(payslip => {
      const year = new Date(payslip.period_start).getFullYear();
      const existing = yearMap.get(year) || { gross: 0, net: 0, hours: 0, count: 0 };
      
      yearMap.set(year, {
        gross: existing.gross + payslip.gross_income,
        net: existing.net + payslip.net_pay,
        hours: existing.hours + payslip.total_worked_hours,
        count: existing.count + 1
      });
    });
  
    return Array.from(yearMap.entries())
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, data]) => ({
        name: year.toString(),
        ...data
      }));
  }, [payslipHistory]);

  const biweeklyDistribution = useMemo(() => {
    if (!payslipHistory) return [];
    
    return payslipHistory
      .map(payslip => ({
        period: `${format(parseISO(payslip.period_start), "MMM d")} - ${format(parseISO(payslip.period_end), "MMM d")}`,
        gross: payslip.gross_income,
        net: payslip.net_pay,
        hours: payslip.total_worked_hours,
        period_start: payslip.period_start
      }))
      .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
      .slice(-12);
  }, [payslipHistory]);

  const deductionData = useMemo(() => {
    if (!currentPayslip) return [];
    
    return [
      { name: "Federal Tax", value: currentPayslip.federal_tax },
      { name: "Provincial Tax", value: currentPayslip.provincial_tax },
      { name: "CPP Contributions", value: currentPayslip.cpp_contributions },
      { name: "EI Premiums", value: currentPayslip.ei_premiums }
    ];
  }, [currentPayslip]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedSlips(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const navigatePeriod = useCallback((direction: "previous" | "next") => {
    const newDate = direction === "previous" 
      ? subDays(dateRange.start, 14) 
      : addDays(dateRange.start, 14);
    setDateRange(prev => ({
      ...prev,
      start: newDate,
      end: addDays(newDate, 13),
      apiStart: format(newDate, "yyyy-MM-dd"),
      apiEnd: format(addDays(newDate, 13), "yyyy-MM-dd"),
      display: `${format(newDate, "MMM d")} - ${format(addDays(newDate, 13), "MMM d, yyyy")}`
    }));
  }, [dateRange.start]);

  const handleDownload = async (payslip: Payslip) => {
    try {
      const doc = generatePayslipPDF(payslip);
      doc.save(`payslip-${format(parseISO(payslip.period_start), 'yyyyMMdd')}.pdf`);
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate payslip');
      console.error('Download error:', error);
    }
  };

  if (isLoadingCurrent || isLoadingHistory || isLoadingYTD) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  if (isErrorCurrent || isErrorHistory || isErrorYTD) {
    const error = errorCurrent || errorHistory || errorYTD;
    return <PayslipError onRetry={() => window.location.reload()} error={error?.message} />;
  }

  if (!currentPayslip || !payslipHistory || !ytdSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Info className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-medium">No payslip data found</h3>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PayslipStatsCards 
        currentPayslip={currentPayslip}
        payslipHistory={payslipHistory}
        ytdSummary={ytdSummary}
      />

      <PayslipTabsSection
        currentPayslip={currentPayslip}
        recentPayslips={recentPayslips}
        expandedSlips={expandedSlips}
        toggleExpand={toggleExpand}
        handleDownload={handleDownload}
        navigatePeriod={navigatePeriod}
        dateRange={dateRange}
      />

      <PayslipChartsSection
        yearlyData={yearlyData}
        biweeklyDistribution={biweeklyDistribution}
        deductionData={deductionData}
        currentPayslip={currentPayslip}
      />
    </div>
  );
};

export default EmployeePayslipView;