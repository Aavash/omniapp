// components/payslip/PayslipDetails.tsx
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Payslip } from "@/types/payslip";

interface PayslipDetailsProps {
  payslip: Payslip;
}

export const PayslipDetails = ({ payslip }: PayslipDetailsProps) => {
  const payrate = payslip.hourly_rate || 0;
  const overtimeRate = payrate * 1.5;
  const regularHours = payslip.total_worked_hours - payslip.total_overtime_hours;
  const overtimeHours = payslip.total_overtime_hours;
  
  const regularPay = payslip.regular_pay || regularHours * payrate;
  const overtimePay = payslip.overtime_pay || overtimeHours * overtimeRate;
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
                <p className="text-lg font-semibold">{formatCurrency(payrate)}/h</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-xs">
                <p className="text-sm text-gray-500 dark:text-gray-400">Overtime Rate</p>
                <p className="text-lg font-semibold">{formatCurrency(overtimeRate)}/h</p>
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
                <span className="font-medium">{formatCurrency(regularPay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Overtime Pay</span>
                <span className="font-medium">{formatCurrency(overtimePay)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-green-600 dark:text-green-400">
                <span>Total Earnings</span>
                <span>{formatCurrency(payslip.gross_income)}</span>
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
                <span className="font-medium">{formatCurrency(payslip.federal_tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Provincial Tax</span>
                <span className="font-medium">{formatCurrency(payslip.provincial_tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CPP Contributions</span>
                <span className="font-medium">{formatCurrency(payslip.cpp_contributions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">EI Premiums</span>
                <span className="font-medium">{formatCurrency(payslip.ei_premiums)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-red-600 dark:text-red-400">
                <span>Total Deductions</span>
                <span>{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay Calculation */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Net Pay Calculation</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Gross Earnings</span>
                <span className="font-medium">{formatCurrency(payslip.gross_income)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Deductions</span>
                <span className="font-medium text-red-500">-{formatCurrency(totalDeductions)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-green-600 dark:text-green-400">
                  <span>Net Pay</span>
                  <span>{formatCurrency(payslip.net_pay)}</span>
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
};