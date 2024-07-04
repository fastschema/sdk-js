import { ResponseError } from './request';
import { ListOptions } from './types';

export const getErrorMessage = (resp: ResponseError | string, defaultMessage = '') => {
  if (typeof resp === 'string') {
    return resp;
  }

  return resp.message ?? defaultMessage;
}

export const getContentFilterQuery = (params?: ListOptions) => {
  const query: { [k: string]: any } = {};
  params?.limit && (query['limit'] = params.limit);
  params?.page && (query['page'] = params.page);
  params?.sort && (query['sort'] = params.sort);
  params?.select && (query['select'] = params.select);
  params?.filter && (query['filter'] = JSON.stringify(params.filter));
  return new URLSearchParams(query).toString();
};

export const isObject = (value: any):boolean => {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export const sortObject = <T = any>(obj: T): T => {
  // Return if obj is not an object or array
  if (!isObject(obj) && !Array.isArray(obj)) {
    return obj;
  }

  // obj is an array
  if (Array.isArray(obj)) {
    const arrayItems = obj.map(item => {
      return sortObject(item);
    });

    return [...arrayItems].sort((a, b) => {
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    }) as T;
  }

  // obj is an object
  const sortedKeys = Object.keys(obj as object).sort((a, b) => a.localeCompare(b));
  const result = {} as Record<string, any>;
  for (const key of sortedKeys) {
    result[key] = sortObject((obj as Record<string, any>)[key]);
  }
  return result as T;
}

export const createObjectId = <T = any>(obj: T): string => {
  return JSON.stringify(sortObject(obj));
}
