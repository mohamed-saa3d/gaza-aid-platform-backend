export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  image?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type PendingRegistration = {
  name: string;
  email: string;
  password: string;
  image?: string;
  otpHash: string;
  createdAt: number;
};
