export type UserRole = "admin" | "investor";

export type InvestorRecord = {
  id: number;
  fullName: string;
  email: string;
  amount: number;
  projectedReturn: number;
  tier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: number;
  role: UserRole;
  fullName: string;
  email: string;
};
