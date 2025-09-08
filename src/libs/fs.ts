import { Auth, AuthStore, DefaultAuthStore } from './auth';
import { IRequest, FsRequest } from './request';
import { FsFile, Schema, Schemas } from './schema';

export interface FastSchemaBaseOptions {
  request?: FsRequest;
}

export interface FastSchemaOptionsWithAuthKey extends FastSchemaBaseOptions {
  authKey?: string;
}

export interface FastSchemaOptionsWithAuthStore extends FastSchemaBaseOptions {
  authStore: AuthStore;
}

export type FastSchemaOptions = (FastSchemaOptionsWithAuthKey | FastSchemaOptionsWithAuthStore) & {
  authCookieName?: string;
  authDisableAutoHeader?: boolean;
};

export class FastSchema {
  private _request: IRequest;
  private _authStore: AuthStore;
  private _opts: FastSchemaOptions;
  private _auth: Auth;
  private _schemas: Schemas;
  private _file: FsFile | undefined;

  constructor(private appUrl: string, opts?: FastSchemaOptions) {
    this.appUrl = appUrl;
    this._opts = {
      ...(opts ?? {}),
    };

    if ('authStore' in this._opts) {
      this._authStore = this._opts.authStore;
    } else {
      this._authStore = new DefaultAuthStore(this._opts.authKey);
    }

    this._request = opts?.request ?? new FsRequest(this.appUrl, {
      authCookieName: this._opts.authCookieName,
      authDisableAutoHeader: this._opts.authDisableAutoHeader,
      getAuthToken: this._authStore.getToken.bind(this._authStore),
    });
    this._auth = new Auth(this._authStore, this._request);
    this._schemas = new Schemas(this._request);
  }

  auth(): Auth {
    return this._auth;
  }

  request(): IRequest {
    return this._request;
  }

  async syncSchemas(): Promise<void> {
    await this._schemas.sync();
  }

  async init(): Promise<void> {
    await this.auth().data();
    // await this._schemas.sync();
  }

  schemas(): Schemas {
    return this._schemas;
  }

  schema(): Schema[];
  schema(name: string): Schema;
  schema(name?: string): Schema[] | Schema {
    return this._schemas.schema(name);
  }

  file(): FsFile {
    if (!this._file) {
      const fileSchema = this.schema('file');
      this._file = new FsFile(fileSchema?.raw(), this._request);
    }

    return this._file;
  }
}
