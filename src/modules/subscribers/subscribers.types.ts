export type SubscribeInput = {
  email: string;
};

export type BroadcastMessageInput = {
  subject: string;
  message: string;
};

export type GetAllSubscribersInput = {
  page: number;
  limit: number;
};
