import { getErrorMessage } from './helpers';
import { RequestError } from './error';

export type RequestMethods =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'
  | 'TRACE';
export type RequestHeaders = Record<string, string>;

export interface FsRequestOptions {
  apiBaseName?: string;
  authCookieName?: string;
  authDisableAutoHeader?: boolean;
  authUseXAuthTokenHeader?: boolean;
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
  post<T>(
    url: string,
    data?: RequestData,
    options?: RequestOptions
  ): Promise<T>;
  put<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<T>;
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
  patch<T>(
    url: string,
    data?: RequestData,
    options?: RequestOptions
  ): Promise<T>;
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

  async getRequestHeader(
    headers?: RequestHeaders,
    data?: any
  ): Promise<RequestHeaders> {
    const authToken = (await this.getAuthToken?.()) ?? undefined;
    const requestHeaders: RequestHeaders = {
      'Content-Type': 'application/json;charset=utf-8',
      ...(headers ?? {}),
    };

    if (data instanceof FormData) {
      delete requestHeaders['Content-Type'];
    }

    if (this.opts.authDisableAutoHeader) {
      return requestHeaders;
    }

    if (authToken) {
      if (this.opts.authUseXAuthTokenHeader) {
        requestHeaders['X-Auth-Token'] = authToken;
        return requestHeaders;
      }

      if (this.opts.authCookieName) {
        const existingCookies = requestHeaders['Cookie']
          ? requestHeaders['Cookie'] + '; '
          : '';
        requestHeaders[
          'Cookie'
        ] = `${existingCookies}${this.opts.authCookieName}=${authToken}`;
        return requestHeaders;
      }

      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    return requestHeaders;
  }

  async createRequestInit(
    method: string,
    data?: any,
    options?: RequestOptions
  ): Promise<RequestInit> {
    const headers = options?.headers ?? {};
    const requestInit: RequestInit = {
      method: method,
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: await this.getRequestHeader(headers, data),
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
    options?: RequestOptions
  ): Promise<T> => {
    const requestInit = await this.createRequestInit(method, data, options);
    const response = await fetch(this.createRequestUrl(url), requestInit);

    if (!response.ok) {
      let msg = response.statusText ?? 'Network response was not ok';
      try {
        const errorResponse = await response.json();
        msg = getErrorMessage(errorResponse.error, msg);
      } catch (e) {}

      throw new RequestError(msg);
    }

    const result: Result<T> = await response.json();

    if (result.error) {
      throw new RequestError(getErrorMessage(result.error));
    }

    return (result as { data: T }).data;
  };

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.createRequest<T>('GET', url, null, options);
  }

  async post<T>(
    url: string,
    data?: RequestData,
    options?: RequestOptions
  ): Promise<T> {
    return await this.createRequest<T>('POST', url, data, options);
  }

  async put<T>(
    url: string,
    data?: RequestData,
    options?: RequestOptions
  ): Promise<T> {
    return await this.createRequest<T>('PUT', url, data, options);
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.createRequest<T>('DELETE', url, null, options);
  }

  async patch<T>(
    url: string,
    data?: RequestData,
    options?: RequestOptions
  ): Promise<T> {
    return await this.createRequest<T>('PATCH', url, data, options);
  }

  async head<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.createRequest<T>('HEAD', url, null, options);
  }

  async options<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.createRequest<T>('OPTIONS', url, null, options);
  }

  async connect<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.createRequest<T>('CONNECT', url, null, options);
  }

  async trace<T>(url: string, options?: RequestOptions): Promise<T> {
    return await this.createRequest<T>('TRACE', url, null, options);
  }
}
