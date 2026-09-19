export type CreateCategoryInput = {
  nameAr: string;
  nameEn: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CategoryQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
};
