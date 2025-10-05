import { Employee } from "@/models/Employee";

export class EmployeeService {
  private employees: Employee[];

  constructor(initialEmployees: Employee[]) {
    this.employees = initialEmployees;
  }

  addEmployee(employee: Employee) {
    this.employees.push(employee);
    return this.employees;
  }

  updateEmployee(updatedEmployee: Employee) {
    const index = this.employees.findIndex((r) => r.id === updatedEmployee.id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...updatedEmployee };
    }
    return this.employees;
  }

  removeEmployee(id: number) {
    this.employees = this.employees.filter((r) => r.id !== id);
    return this.employees;
  }

  getEmployees() {
    return [...this.employees];
  }
}
