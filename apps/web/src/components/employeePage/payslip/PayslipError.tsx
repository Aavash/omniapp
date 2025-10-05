// components/payslip/PayslipError.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface PayslipErrorProps {
  onRetry: () => void;
  error?: string;
}

export const PayslipError = ({ onRetry, error }: PayslipErrorProps) => {
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
};