import { DefaultAuthStore, FastSchema, FastSchemaOptions, FsRequest, SchemaRawData } from '@/index';
import system_schemas from './system_schemas.json';
import user_schemas from './user_schemas.json';

export interface Tag {
  id: number;
  name: string;
  description: string;
}

export const systemSchemas = system_schemas as Record<string, SchemaRawData>;
export const userSchemas = user_schemas as Record<string, SchemaRawData>;


export type FsTestOptions = FastSchemaOptions & {
  appUrl?: string;
  skipLogin?: boolean;
  onStart?: (fs: FastSchema) => Promise<void>;
};

export const cleanup = async (fs: FastSchema) => {
  try {
    await fs.schemas().delete('tag');
    await fs.schemas().delete('blog');
    await waitServerReady(fs);
  } catch (e) {}
};

export const waitServerReady = async (fs: FastSchema) => {
  while (true) {
    try {
      await fs.init();
      return true;
    } catch (e) {
      console.error(e);
    }
    await new Promise(r => setTimeout(r, 100));
  }
};

export const createTestFs = async (opts?: FsTestOptions) => {
  opts = opts ?? {};
  const appUrl = opts.appUrl ?? 'http://localhost:8000';
  const authStore = new DefaultAuthStore();
  const request = opts?.request ?? new FsRequest(appUrl, {
    getAuthToken: () => authStore.getToken(),
  });
  const fs = new FastSchema(appUrl, {
    authStore,
    authKey: ('authKey' in opts) ? opts.authKey : undefined,
    request,
  });

  if (!opts.skipLogin) {
    await fs.auth().login({ login: 'admin', password: '123' });
    await fs.init();
  }

  await opts?.onStart?.(fs)

  return fs;
}

export const clearCookies = () => {
  if (typeof document !== 'undefined') {
    document.cookie.split(";").forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()}`);
    });
    window.localStorage.clear();
  }
}

export const createUserToken = (email: string): string => {
  const data = {
    exp: 1720444734,
    user: {
      id: 1,
      username: email,
      email: email,
      active: true,
      role_ids: [1]
    },
  }

  return createJWTToken(data);
}

export const createJWTToken = (data: any): string => {
  const dataStr = JSON.stringify(data);
  const dataBase64 = btoa(dataStr);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const headerStr = JSON.stringify(header);
  const headerBase64 = btoa(headerStr);
  const signature = 'signature';
  return `${headerBase64}.${dataBase64}.${signature}`;
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
