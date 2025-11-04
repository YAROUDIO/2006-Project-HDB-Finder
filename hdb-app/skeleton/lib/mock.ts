export type MockUser = {
  username: string;
  income?: number;
  citizenship?: string;
  householdSize?: number;
  loan?: string;
  flatType?: string;
  budget?: number;
  area?: string;
  leaseLeft?: number;
};

export const mockUser: MockUser = {
  username: "demo",
  income: 80000,
  citizenship: "Singapore",
  householdSize: 3,
  loan: "Loan A",
  flatType: "4-room",
  budget: 600000,
  area: "East",
  leaseLeft: 75,
};
