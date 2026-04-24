export type UserRole = "admin" | "investor";

export type InvestorRecord = {
  id: number;
  fullName: string;
  email: string;
  amount: number;
  projectedReturn: number;
  pendingAmount: number;
  disbursedAmount: number;
  accountManager: string;
  tier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type WithdrawalRecord = {
  id: number;
  investorId: number;
  method: string;
  destination: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type SessionUser = {
  id: number;
  role: UserRole;
  fullName: string;
  email: string;
};
