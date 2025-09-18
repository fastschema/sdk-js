import { Content } from './content';

export interface ListOptions {
  filter?: Filter;
  page?: number;
  limit?: number;
  sort?: string;
  select?: string;
}

export type FilterOperator =
  | '$eq'
  | '$neq'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$notlike'
  | '$contains'
  | '$notcontains'
  | '$containsfold'
  | '$notcontainsfold'
  | '$like'
  | '$in'
  | '$nin'
  | '$null';
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[]
  | null[];

export interface FilterFieldsObject {
  [key: string]: FilterObject | FilterValue | Filter[];
}

export interface FilterAndOr {
  $or?: Filter[];
  $and?: Filter[];
}

export type FilterMixedFieldsAndOr = FilterFieldsObject & FilterAndOr;

export type Filter = FilterMixedFieldsAndOr | FilterFieldsObject;

export type FilterObject = {
  [k in FilterOperator]?: FilterValue;
};

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface Pagination<T = Content> extends PaginationMeta {
  items: T[];
}
