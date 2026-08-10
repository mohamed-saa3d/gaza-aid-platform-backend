export type CreateNewsInput = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  detailsUrl?: string | null;
  isUrgent?: boolean;
};

export type UpdateNewsInput = {
  id: string;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  image?: string;
  detailsUrl?: string | null;
  isUrgent?: boolean;
};
