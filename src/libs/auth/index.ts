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

export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ActivationStatus {
  activation: 'auto' | 'manual' | 'email' | 'activated';
}

export class Auth {
  private authData: AuthData | undefined;
  constructor(private store: AuthStore, private request: IRequest) {}

  useToken(token: string): void {
    this.authData = parseUserInfo(token);
  }

  async data(): Promise<AuthData | undefined> {
    if (!this.authData) {
      const token = await this.store.getToken();
      if (token) {
        this.useToken(token);
      }
    }
    return this.authData;
  }

  async user(): Promise<User | undefined> {
    const authData = await this.data();
    return authData?.user;
  }

  async me(): Promise<User> {
    const user = await this.request.get<User>('/auth/me');
    return user;
  }

  async logout(): Promise<void> {
    this.authData = undefined;
    this.store.clearToken();
  }

  // Use for local login or oauth login
  async login(provider: string, data?: UserLoginData): Promise<AuthData> {
    const loginResponse = await this.request.post<
      Pick<AuthData, 'token' | 'expires'>
    >(`/auth/${provider}/login`, data);
    this.authData = {
      ...parseUserInfo(loginResponse.token),
      ...loginResponse,
    };

    this.store.setToken(this.authData.token);
    return this.authData;
  }

  // Use for local registration
  async register(data: UserRegisterData): Promise<ActivationStatus> {
    const registerResponse = await this.request.post<ActivationStatus>(
      `/auth/local/register`,
      data
    );
    return registerResponse;
  }

  // Activate local registration
  async activate(token: string): Promise<ActivationStatus> {
    return await this.request.post(`/auth/local/activate`, { token });
  }

  // Resend activation link
  async resendActivationLink(token: string): Promise<ActivationStatus> {
    return await this.request.post(`/auth/local/activate/send`, { token });
  }

  // Recover password
  async recover(email: string): Promise<boolean> {
    return await this.request.post(`/auth/local/recover`, { email });
  }

  // Recovery token check
  async recoverCheck(token: string): Promise<boolean> {
    return await this.request.post(`/auth/local/recover/check`, { token });
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<boolean> {
    return await this.request.post(`/auth/local/recover/reset`, data);
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
