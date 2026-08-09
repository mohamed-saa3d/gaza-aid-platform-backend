export const isMongoObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);
