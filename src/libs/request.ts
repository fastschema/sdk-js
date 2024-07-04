import { getErrorMessage } from './helpers';
import { RequestError } from './error';

export type RequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
export type RequestHeaders = Record<string, string>;

export interface FsRequestOptions {
  apiBaseName?: string;
  getAuthToken: (authKey?: string) => Promise<string | undefined>;
}

export type RequestData = Record<string, any> | FormData;

export type ResponseError = {
  message: string;
  code?: string;
  detail?: string;
};

export type Result<T = any> = {
  error?: ResponseError | string;
  data?: T;
};

export interface RequestOptions {
  headers?: RequestHeaders;
}

export interface IRequest {
  baseUrl: () => string;
  baseApiUrl: () => string;
  getAuthToken: (() => Promise<string | undefined>) | undefined;
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<T>;
  put<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<T>;
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
  patch<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<T>;
  head<T>(url: string, options?: RequestOptions): Promise<T>;
  options<T>(url: string, options?: RequestOptions): Promise<T>;
  connect<T>(url: string, options?: RequestOptions): Promise<T>;
  trace<T>(url: string, options?: RequestOptions): Promise<T>;
}

export class FsRequest {
  public getAuthToken: (() => Promise<string | undefined>) | undefined;
  private _baseApiUrl: string;

  constructor(private _baseUrl: string, private opts: FsRequestOptions) {
    this.opts = this.opts ?? {};
    this.opts.apiBaseName = this.opts.apiBaseName ?? 'api';
    this._baseApiUrl = this._baseUrl + '/' + this.opts.apiBaseName;
    this.getAuthToken = this.opts.getAuthToken;
  }

  baseUrl(): string {
    return this._baseUrl;
  }

  baseApiUrl(): string {
    return this._baseApiUrl;
  }

  async getRequestHeader(headers?: RequestHeaders, data?: any): Promise<RequestHeaders> {
    const authToken = (await this.getAuthToken?.()) ?? undefined;
    const requestHeaders: RequestHeaders = {
      'Content-Type': 'application/json;charset=utf-8',
      ...(headers ?? {}),
    };

    if (data instanceof FormData) {
      delete requestHeaders['Content-Type'];
    }

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    return requestHeaders;
  }

  async createRequestInit(method: string, data?: any, headers?: RequestHeaders): Promise<RequestInit> {
    const requestInit: RequestInit = {
      method: method,
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: await this.getRequestHeader(headers ?? {}, data),
      redirect: 'follow',
      referrerPolicy: 'strict-origin-when-cross-origin',
    };

    if (data) {
      if (data instanceof FormData) {
        requestInit.body = data;
      } else {
        requestInit.body = JSON.stringify(data);
      }
    }

    return requestInit;
  }

  createRequestUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = this._baseApiUrl + url;
    }

    return url;
  }

  createRequest = async <T>(
    method: RequestMethods,
    url: string,
    data?: any,
    headers?: RequestHeaders,
  ): Promise<T> => {
    const requestInit = await this.createRequestInit(method, data, headers);
    const response = await fetch(this.createRequestUrl(url), requestInit);

    if (!response.ok) {
      let msg = response.statusText ?? 'Network response was not ok';
      try {
        const errorResponse = await response.json();
        msg = getErrorMessage(errorResponse.error, msg);
      } catch (e) { }

      throw new RequestError(msg);
    }

    const result: Result<T> = await response.json();

    if (result.error) {
      throw new RequestError(getErrorMessage(result.error));
    }

    return (result as { data: T }).data;
  }

  async get<T>(url: string, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('GET', url, null, headers);
  }

  async post<T>(url: string, data?: RequestData, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('POST', url, data, headers);
  }

  async put<T>(url: string, data?: RequestData, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('PUT', url, data, headers);
  }

  async delete<T>(url: string, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('DELETE', url, null, headers);
  }

  async patch<T>(url: string, data?: RequestData, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('PATCH', url, data, headers);
  }

  async head<T>(url: string, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('HEAD', url, null, headers);
  }

  async options<T>(url: string, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('OPTIONS', url, null, headers);
  }

  async connect<T>(url: string, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('CONNECT', url, null, headers);
  }

  async trace<T>(url: string, headers?: RequestHeaders): Promise<T> {
    return await this.createRequest<T>('TRACE', url, null, headers);
  }
}
