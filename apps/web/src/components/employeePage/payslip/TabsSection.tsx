// components/payslip/TabsSection.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar } from "lucide-react";
import { CurrentPayslipTable } from "./CurrentPayslipTable";
import { RecentPayslipsTable } from "./RecentPayslipsTable";

export const PayslipTabsSection = ({
  currentPayslip,
  recentPayslips,
  expandedSlips,
  toggleExpand,
  handleDownload,
  navigatePeriod,
  dateRange
}: {
  currentPayslip: Payslip;
  recentPayslips: Payslip[];
  expandedSlips: Record<number, boolean>;
  toggleExpand: (id: number) => void;
  handleDownload: (payslip: Payslip) => void;
  navigatePeriod: (direction: "previous" | "next") => void;
  dateRange: any;
}) => {
  return (
    <Tabs defaultValue="current" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="current">
          <FileText className="h-4 w-4 mr-2" />
          Current Payslip
        </TabsTrigger>
        <TabsTrigger value="recent">
          <Calendar className="h-4 w-4 mr-2" />
          Recent Payslips
        </TabsTrigger>
      </TabsList>

      <TabsContent value="current">
        <CurrentPayslipTable 
          payslip={currentPayslip}
          isExpanded={!!expandedSlips[currentPayslip.employee_id]}
          toggleExpand={toggleExpand}
          handleDownload={handleDownload}
          navigatePeriod={navigatePeriod}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="recent">
        <RecentPayslipsTable 
          payslips={recentPayslips}
          expandedSlips={expandedSlips}
          toggleExpand={toggleExpand}
          handleDownload={handleDownload}
        />
      </TabsContent>
    </Tabs>
  );
};