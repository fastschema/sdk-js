import { IRequest } from '../request';
import { User } from '../types';
import { AuthStore, AuthData } from './store';
import { jwtDecode } from 'jwt-decode';

export * from './store';

export interface UserLoginData {
  login: string;
  password: string;
}

export interface UserRegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResult {
  status: 'success' | 'error' | 'pending'; // pending is for email verification
}

export class Auth {
  private authData: AuthData | undefined;
  constructor(private store: AuthStore, private request: IRequest) {}

  useToken(token: string): void {
    this.authData = parseUserInfo(token);
  }

  data(): AuthData | undefined {
    return this.authData;
  }

  async me(): Promise<User> {
    const user = await this.request.get<User>('/auth/me');
    return user;
  }

  async login(data: UserLoginData): Promise<AuthData> {
    const loginResponse = await this.request.post<
      Pick<AuthData, 'token' | 'expires'>
    >('/auth/local/login', data);
    this.authData = {
      ...parseUserInfo(loginResponse.token),
      ...loginResponse,
    };

    this.store.setToken(this.authData.token);
    return this.authData;
  }

  async register(data: UserRegisterData): Promise<RegisterResult> {
    const registerResponse = await this.request.post<RegisterResult>(
      '/auth/local/register',
      data
    );
    return registerResponse;
  }
}

export const parseUserInfo = (token: string): AuthData => {
  const decodedHeader = jwtDecode<AuthData>(token, { header: true });
  const decodedPayload = jwtDecode<AuthData>(token);
  return {
    ...decodedPayload,
    alg: decodedHeader.alg,
    typ: decodedHeader.typ,
  };
};
