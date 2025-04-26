export type PixKeyType = 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';

export type PixResultData = {
  found: boolean;
  owner: string;
  bank: string;
  userId?: string;
};

export type PixResults = {
  [key in Exclude<PixKeyType, 'RANDOM'>]: PixResultData;
};

export interface PixKeyResult {
  key: string;
  owner: string;
  found: boolean;
  userId?: string;
}

export interface PixTransferResult {
  success: boolean;
  message: string;
  amount?: number;
  receiver?: string;
  newBalance?: number;
} 