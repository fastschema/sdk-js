import Cookies from 'js-cookie';
import { User } from '@/libs/types';

export interface AuthData {
  alg: string;
  typ: string;
  exp: number;
  user: User;
  token: string;
  expires: string;
}

// An extra key parameter is added to the methods to allow storing multiple tokens
export interface AuthStore {
  getDefaultKey(): string;
  setToken(token: string, key?: string): Promise<void>;
  getToken(key?: string): Promise<string | undefined>;
}

export class DefaultAuthStore {
  private store: AuthStore;

  constructor(defaultKey = 'token') {
    if (typeof window !== 'undefined') {
      this.store = new BrowserStore(defaultKey);
    } else {
      this.store = new NodeStore(defaultKey);
    }
  }

  getDefaultKey(): string {
    return this.store.getDefaultKey();
  }

  setToken(token: string, key?: string): Promise<void> {
    return this.store.setToken(token, key);
  }

  getToken(key?: string): Promise<string | undefined> {
    return this.store.getToken(key);
  }
}

export class BaseAuthStore {
  constructor(protected defaultKey: string) { }

  getDefaultKey(): string {
    return this.defaultKey;
  }
}

// In browser environment, we can use cookies to store the token
export class BrowserStore extends BaseAuthStore {
  private cookie = Cookies;

  setToken(token: string, key?: string): Promise<void> {
    this.cookie.set(key ?? this.defaultKey, token, { expires: 1 });
    return Promise.resolve();
  }

  getToken(key?: string): Promise<string | undefined> {
    return Promise.resolve(this.cookie.get(key ?? this.defaultKey));
  }
}

// In node environment, we can't use cookies, so we use a simple in-memory store
// A node process may be used by multiple users, so we need to support multiple keys
// This is why we have a key parameter in the methods, so each user can have their own token
export class NodeStore extends BaseAuthStore {
  private store: Record<string, string> = {};

  setToken(token: string, key?: string): Promise<void> {
    this.store[key ?? this.defaultKey] = token;
    return Promise.resolve();
  }

  getToken(key?: string): Promise<string | undefined> {
    return Promise.resolve(this.store[key ?? this.defaultKey]);
  }
}
