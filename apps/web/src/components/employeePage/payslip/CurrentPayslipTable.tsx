// components/employeePage/payslip/CurrentPayslipTable.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { PayslipDetails } from "./PayslipDetails";
import { Payslip } from "@/types/payslip";

interface DateRange {
  start: Date;
  end: Date;
  apiStart: string;
  apiEnd: string;
  display: string;
}

interface CurrentPayslipTableProps {
  payslip: Payslip;
  isExpanded: boolean;
  toggleExpand: (id: number) => void;
  handleDownload: (payslip: Payslip) => void;
  navigatePeriod: (direction: "previous" | "next") => void;
  dateRange: DateRange;
}
const getPaymentStatus = (periodEnd: string) => {
  const endDate = new Date(periodEnd);
  const today = new Date();
  return endDate < today ? { status: "Paid", variant: "default" } : { status: "Pending", variant: "secondary" };
};

export const CurrentPayslipTable = ({
  payslip,
  isExpanded,
  toggleExpand,
  handleDownload,
  navigatePeriod,
  dateRange
}: CurrentPayslipTableProps) => {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Current Payslip</CardTitle>
            <CardDescription className="mt-1">
              {dateRange.display}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigatePeriod("previous")}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigatePeriod("next")}
              disabled={dateRange.end >= new Date()}
            >
              Next
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleDownload(payslip)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Hours Worked</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-muted/50">
              <TableCell>
                {format(parseISO(payslip.period_start), "MMM d")} -{" "}
                {format(parseISO(payslip.period_end), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                {payslip.total_worked_hours.toFixed(1)}h
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(payslip.gross_income)}
              </TableCell>
              <TableCell className="text-right font-medium">
                <Badge variant="outline" className="px-2 py-1">
                  {formatCurrency(payslip.net_pay)}
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
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExpanded ? "Collapse" : "Expand"} details
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
            
            {isExpanded && (
              <TableRow className="bg-muted/30">
                <TableCell colSpan={6} className="p-0">
                  <PayslipDetails payslip={payslip} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};