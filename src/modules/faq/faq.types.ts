export type CreateFaqInput = {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  isActive?: boolean;
};

export type UpdateFaqInput = {
  id: string;
  questionAr?: string;
  questionEn?: string;
  answerAr?: string;
  answerEn?: string;
  isActive?: boolean;
};
