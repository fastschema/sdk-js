import { DefaultAuthStore, parseUserInfo } from '@/index';
import { clearCookies } from '@tests/utils';
import { afterEach, beforeEach, describe, expect, it, test } from 'vitest';

beforeEach(clearCookies);
afterEach(clearCookies);

export const testUser = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjA0NDQ3MzQsInVzZXIiOnsiaWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGxvY2FsLmx0ZCIsImFjdGl2ZSI6dHJ1ZSwicm9sZV9pZHMiOlsxXX19.MN79DXrAjUQj3mvgNQOTb2YkeIO1gQklQCUqN38AkPs',
  payload: {
    exp: 1720444734,
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@local.ltd',
      active: true,
      role_ids: [1]
    },
    alg: 'HS256',
    typ: 'JWT',
  },
}

describe('Auth tests', async () => {
  // @ts-ignore
  (typeof globalThis !== 'undefined') && (globalThis.atob = undefined);
  await import('@/libs/auth/atob');
  test('polyfill atob for jwtDecode', _ => expect(atob).toBeDefined());

  it('auth store key is valid', () => {
    expect(new DefaultAuthStore().getDefaultKey()).toBe('token');
    expect(new DefaultAuthStore('custom').getDefaultKey()).toBe('custom');
  });

  it('auth store set and get with key', async () => {
    const store = new DefaultAuthStore();
    await store.setToken('test', 'customkey');
    expect(await store.getToken()).toBe(undefined);
    expect(await store.getToken('customkey')).toBe('test');
    await store.setToken('test');
    expect(await store.getToken()).toBe('test');
  });

  it('parse user info', () => {
    const authData = parseUserInfo(testUser.token);
    expect(authData).toEqual(testUser.payload);
  });
});
