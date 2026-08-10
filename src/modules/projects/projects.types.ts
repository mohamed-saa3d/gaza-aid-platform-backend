import type { ProjectStatus } from '@prisma/client';

export type CreateProjectInput = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl?: string;
  targetAmount: number;
  status: ProjectStatus;
  categoryId: string;
};

export type UpdateProjectInput = {
  id: string;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string | null;
  targetAmount?: number;
  status?: ProjectStatus;
  categoryId?: string;
};
