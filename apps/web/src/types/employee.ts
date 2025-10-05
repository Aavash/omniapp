// Define the Employee type
export type Employee = {
  id?: number;
  full_name: string;
  email: string;
  phone_number: string;
  phone_number_ext: string;
  address: string;
  password: string;
  pay_type: "HOURLY" | "SALARY";
  payrate: number;
  is_owner: boolean;
  is_active?: boolean;
};
