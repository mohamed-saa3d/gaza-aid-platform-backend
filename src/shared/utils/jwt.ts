import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export type AuthTokenPayload = {
  id: string;
  role: string;
  sessionId?: string;
  email?: string;
  isAdmin?: boolean;
  exp?: number;
  iat?: number;
};

export const signToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AuthTokenPayload;
};

export const signRefreshToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as AuthTokenPayload;
};
