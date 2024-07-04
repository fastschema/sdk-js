/**
 * @vitest-environment node
 */

import createFetchMock from 'vitest-fetch-mock';
import { it, expect, vi, beforeAll, afterAll, describe } from 'vitest';
import { FsRequest } from '@/libs/request';

describe('Request tests', async () => {
  const todoList = [
    { id: 1, title: 'Do something' },
    { id: 2, title: 'Do something else' },
  ];
  const fetchMocker = createFetchMock(vi);
  beforeAll(fetchMocker.enableMocks);
  afterAll(fetchMocker.disableMocks);

  fetchMocker.mockIf(/^https?:\/\/example.local.*$/, async req => {
    const method = req.method;
    const bearerToken = req.headers.get('Authorization');
    if (bearerToken !== `Bearer token`) {
      return {
        status: 401,
        body: 'Unauthorized',
      };
    }

    if (req.url.endsWith('/allmethods')) {
      const method = req.method;
      return {
        status: 200,
        body: JSON.stringify({
          data: method,
        }),
      };
    }

    if (method === "GET") {
      if (req.url.endsWith('/todo/error')) {
        return {
          status: 500,
        };
      }

      if (req.url.endsWith('/todo/dataerror')) {
        return {
          status: 500,
          body: JSON.stringify({ error: 'Some error' }),
        };
      }

      if (req.url.endsWith('/todo/dataerror200')) {
        return {
          status: 200,
          body: JSON.stringify({ error: 'Some error like' }),
        };
      }

      if (req.url.endsWith('/todo')) {
        return {
          status: 200,
          body: JSON.stringify({ data: todoList }),
          headers: {},
        };
      }
    }

    if (method === "POST") {
      if (req.url.endsWith('/todo')) {
        if (!req.body) {
          return {
            status: 400,
            body: 'Bad Request',
          };
        }

        const body = await req.text();
        return {
          status: 200,
          body: JSON.stringify({
            data: JSON.parse(body),
          }),
          headers: {},
        };
      }

      if (req.url.endsWith('/todo/formdata')) {
        return {
          status: 200,
          body: JSON.stringify({
            data: { title: 'New todo' },
          }),
          headers: {},
        };
      }
    }

    return {
      status: 404,
      body: 'Not Found',
    };
  });

  const appUrl = 'https://example.local';
  const request = new FsRequest(appUrl, {
    getAuthToken: async () => 'token',
  });

  it('should return valid base url', () => {
    expect(request.baseUrl()).toBe(appUrl);
    expect(request.baseApiUrl()).toBe(appUrl + '/api');
  });

  it('should create get request with unauthorized error', async () => {
    const unauthorizedRequest = new FsRequest(appUrl, {
      getAuthToken: async () => 'token',
    });
    try {
      await unauthorizedRequest.get('/todo');
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('Unauthorized');
    }
  });

  it('should create get request with 500 error', async () => {
    try {
      await request.get('/todo/error');
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('Internal Server Error');
    }
  });

  it('should create get request with data error', async () => {
    try {
      await request.get('/todo/dataerror');
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('Some error');
    }
  });

  it('should create get request with data error status 200', async () => {
    try {
      await request.get('/todo/dataerror200');
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('Some error like');
    }
  });

  it('should create get request with data', async () => {
    const data = await request.get('/todo');
    expect(data).toEqual(todoList);
  });

  it('should create post request with invalid json body', async () => {
    try {
      await request.post('/todo');
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('Bad Request');
    }
  });

  it('should create post request with json data', async () => {
    const data = await request.post('/todo', { title: 'New todo' });
    expect(data).toStrictEqual({ title: 'New todo' });
  });

  it('should create post request with form data', async () => {
    const formData = new FormData();
    formData.append('title', 'New todo');
    const data = await request.post('/todo/formdata', formData);
    expect(data).toStrictEqual({ title: 'New todo' });
  });

  it('it should create request with method PUT', async () => {
    const data = await request.put('/allmethods', {});
    expect(data).toStrictEqual('PUT');
  });

  it('it should create request with method DELETE', async () => {
    const data = await request.delete('/allmethods');
    expect(data).toStrictEqual('DELETE');
  });

  it('it should create request with method PATCH', async () => {
    const data = await request.patch('/allmethods');
    expect(data).toStrictEqual('PATCH');
  });

  it('it should create request with method HEAD', async () => {
    const data = await request.head('/allmethods');
    expect(data).toStrictEqual('HEAD');
  });

  it('it should create request with method OPTIONS', async () => {
    const data = await request.options('/allmethods');
    expect(data).toStrictEqual('OPTIONS');
  });

  it('it should create request with method CONNECT', async () => {
    const data = await request.connect('/allmethods');
    expect(data).toStrictEqual('CONNECT');
  });

  it('it should create request with method TRACE', async () => {
    const data = await request.trace('/allmethods');
    expect(data).toStrictEqual('TRACE');
  });
});
