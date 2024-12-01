import { afterEach, beforeEach, expect, it } from 'vitest';
import { DefaultAuthStore, Auth, FsRequest } from '@/index';
import { clearCookies } from '@tests/utils';
import { describe } from 'node:test';

const createAuthTest = () => {
  const store = new DefaultAuthStore();
  const request = new FsRequest('http://127.0.0.1:8000', {
    getAuthToken: () => store.getToken(),
  });
  const auth = new Auth(store, request);
  return auth;
}

beforeEach(clearCookies);
afterEach(clearCookies);

describe('Auth tests', async () => {
  it('should login fail', async () => {
    const auth = createAuthTest();
    try {
      await auth.login('local', { login: 'test', password: 'test' });
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('should login success', async () => {
    // test login success
    const auth = createAuthTest();
    const authData = await auth.login('local', { login: 'admin', password: '123' });
    expect(authData).toBeDefined
    expect(await auth.data()).toEqual(authData);

    const me = await auth.me();
    expect(me).toBeDefined();
    expect(me.id).toEqual(1);

    // test useToken
    const authWithToken = createAuthTest();

    // invalid token
    try {
      authWithToken.useToken("invalid token");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }

    // valid token
    authWithToken.useToken(authData.token);
    expect(authData).toMatchObject(await authWithToken.data() ?? {});
  });
});
