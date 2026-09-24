export type UpdateProfileInput = {
  userId: string;
  name?: string;
  avatar?: string | null;
  avatarPublicId?: string | null;
};

export type ChangePasswordInput = {
  userId: string;
  oldPassword: string;
  newPassword: string;
};
