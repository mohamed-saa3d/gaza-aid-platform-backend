export type CreateLiveStreamInput = {
  titleAr: string;
  titleEn: string;
  youtubeUrl: string;
  isActive?: boolean;
};

export type UpdateLiveStreamInput = {
  id: string;
  titleAr?: string;
  titleEn?: string;
  youtubeUrl?: string;
  isActive?: boolean;
};
