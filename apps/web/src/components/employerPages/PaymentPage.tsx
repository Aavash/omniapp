import PayslipTable from "./PayslipTable";

interface PaymentInformationProps {
  organizationId: number;
}

const PaymentInformation = ({ organizationId }: PaymentInformationProps) => {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Information</h1>
      </div>

      {/* Payslip Table */}
      <PayslipTable organizationId={organizationId} />
    </div>
  );
};

export default PaymentInformation;