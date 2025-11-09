/**
 * Item data models for TypeScript Lambda
 */

export interface ItemBase {
  name: string;
  description?: string;
  price: number;
}

export interface ItemCreate extends ItemBase {}

export interface ItemUpdate {
  name?: string;
  description?: string;
  price?: number;
}

export interface Item extends ItemBase {
  id: string;
  created_at: number;
  updated_at: number;
}

export interface ItemResponse {
  success: boolean;
  data?: Item;
  message?: string;
}

export interface ItemListResponse {
  success: boolean;
  data: Item[];
  count: number;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
