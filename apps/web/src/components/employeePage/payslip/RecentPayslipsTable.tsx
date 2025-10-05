// components/payslip/RecentPayslipsTable.tsx
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
import React from "react";

export const RecentPayslipsTable = ({
  payslips,
  expandedSlips,
  toggleExpand,
  handleDownload
}: {
  payslips: Payslip[];
  expandedSlips: Record<number, boolean>;
  toggleExpand: (id: number) => void;
  handleDownload: (payslip: Payslip) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payslips</CardTitle>
        {/* <CardDescription>Last 3 biweekly payslips</CardDescription> */}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslips.map((payslip) => (
              <React.Fragment key={`${payslip.employee_id}-${payslip.period_start}`}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>
                    {format(parseISO(payslip.period_start), "MMM d")} -{" "}
                    {format(parseISO(payslip.period_end), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {payslip.total_worked_hours.toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.gross_income)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payslip.net_pay)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={payslip.net_pay > 0 ? "default" : "secondary"}>
                      {payslip.net_pay > 0 ? "Paid" : "Pending"}
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
                    <TableCell colSpan={6} className="p-0">
                      <PayslipDetails payslip={payslip} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};