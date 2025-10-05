// components/payslip/PayslipPDFGenerator.tsx
import { jsPDF } from "jspdf";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Payslip } from "@/types/payslip";

export const generatePayslipPDF = (payslip: Payslip) => {
  const doc = new jsPDF();
  
  // Document metadata
  doc.setProperties({
    title: `Payslip - ${payslip.employee_name}`,
    subject: `Pay period ${format(parseISO(payslip.period_start), "MMM d")} to ${format(parseISO(payslip.period_end), "MMM d, yyyy")}`,
    creator: 'Company Name'
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('EMPLOYEE PAYSLIP', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text(payslip.employee_name, 105, 30, { align: 'center' });

  // Pay period
  doc.setFontSize(12);
  doc.text(
    `Pay Period: ${format(parseISO(payslip.period_start), "MMM d, yyyy")} - ${format(parseISO(payslip.period_end), "MMM d, yyyy")}`,
    14,
    50
  );

  // Employee information
  doc.autoTable({
    startY: 60,
    head: [['Employee Information', '']],
    body: [
      ['Employee Name', payslip.employee_name || ''],
      ['Hourly Rate', formatCurrency(payslip.hourly_rate)],
      ['Pay Type', payslip.pay_type || 'Hourly']
    ],
    theme: 'plain',
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
    styles: { cellPadding: 5 }
  });

  // Earnings section
  doc.autoTable({
    startY: 110,
    head: [['Earnings', 'Hours', 'Rate', 'Amount']],
    body: [
      [
        'Regular Pay',
        (payslip.total_worked_hours - payslip.total_overtime_hours).toFixed(1),
        formatCurrency(payslip.hourly_rate),
        formatCurrency(payslip.regular_pay)
      ],
      [
        'Overtime Pay',
        payslip.total_overtime_hours.toFixed(1),
        formatCurrency(payslip.hourly_rate * 1.5),
        formatCurrency(payslip.overtime_pay)
      ],
      ['Total Earnings', '', '', formatCurrency(payslip.gross_income)]
    ],
    columnStyles: { 3: { halign: 'right' } },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    styles: { cellPadding: 5 }
  });

  // Deductions section
  doc.autoTable({
    startY: doc.lastAutoTable?.finalY || 150,
    head: [['Deductions', 'Amount']],
    body: [
      ['Federal Tax', formatCurrency(payslip.federal_tax)],
      ['Provincial Tax', formatCurrency(payslip.provincial_tax)],
      ['CPP Contributions', formatCurrency(payslip.cpp_contributions)],
      ['EI Premiums', formatCurrency(payslip.ei_premiums)],
      ['Total Deductions', formatCurrency(payslip.federal_tax + payslip.provincial_tax + payslip.cpp_contributions + payslip.ei_premiums)]
    ],
    columnStyles: { 1: { halign: 'right' } },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    styles: { cellPadding: 5 }
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your hard work!', 105, 280, { align: 'center' });
  doc.text('Generated on: ' + format(new Date(), "MMM d, yyyy h:mm a"), 105, 285, { align: 'center' });

  return doc;
};