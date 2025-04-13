import { User as BaseUser } from '../../backend/src/types';

export interface AuthUser extends BaseUser {
  token: string;
}

export type { BaseUser as User }; 