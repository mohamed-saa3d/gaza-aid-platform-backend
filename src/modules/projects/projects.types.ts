import type { ProjectStatus } from '@prisma/client';

export type CreateProjectInput = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl?: string;
  imgPublicId?: string;
  imgUrl?: string;
  targetAmount: number;
  beneficiariesCount?: number;
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
  imgPublicId?: string | null;
  imgUrl?: string | null;
  targetAmount?: number;
  beneficiariesCount?: number;
  status?: ProjectStatus;
  categoryId?: string;
};
