export type CreateCategoryInput = {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  /** Icon key for the frontend icon registry. Defaults to a generic grid icon. */
  icon?: string;
  /** Display order; lower sorts first. Defaults to 100 (i.e. after defaults). */
  order?: number;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CategoryQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Result of a category deletion attempt.
 *
 * When the category still has projects linked to it, the deletion is NOT
 * performed on the first attempt. The caller receives `confirmationRequired`
 * with the authoritative linked-project count so the UI can warn the admin.
 * A second, explicitly confirmed request must be sent to finish the deletion.
 */
export type DeleteCategoryResult =
  | {
      status: 'confirmation_required';
      code: 'CATEGORY_HAS_PROJECTS';
      categoryId: string;
      categoryName: string;
      linkedProjectCount: number;
    }
  | {
      status: 'deleted';
      categoryId: string;
      unassignedProjectCount: number;
    };
