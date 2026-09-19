export type CreateCategoryInput = {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CategoryQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
};
