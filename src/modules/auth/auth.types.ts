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
