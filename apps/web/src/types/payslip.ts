// types/payslip.ts
export interface Payslip {
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
    payrate: number;
    pay_type: string;
    hourly_rate: number;
    regular_pay: number;
    overtime_pay: number;
  }
  
  export interface YTDSummary {
    year: number;
    start_date: string;
    end_date: string;
    total_payslips: number;
    total_gross_income: number;
    total_taxes: number;
    total_cpp_contributions: number;
    total_ei_premiums: number;
    total_net_pay: number;
    average_net_per_pay: number;
    payslips?: Payslip[];
  }