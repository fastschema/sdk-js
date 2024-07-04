import { RelationContentUpdate } from './mutation';

export interface Resource {
  group?: boolean;
  id: string;
  name: string;
  whitelist?: boolean;
  resources?: Resource[];
}

export interface Content {
  [key: string]: any;
  id?: number;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface Permission {
  id: number;
  resource: string;
  value: string;
  role_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface Role {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  root: boolean;
  permissions?: string[];
  users?: User[] | RelationContentUpdate;
}

export interface User extends Content {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  username: string;
  email?: string;
  api_key: string;
  provider: string;
  provider_id: string;
  password?: string;
  active: boolean;
  credits: number;
  role_id?: number;
  roles?: Role[];
}

export interface Media extends Content {
  id: number;
  url: string;
  name: string;
  size: number;
  type: string;
  disk: string;
  path: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface MediasUploadResult {
  success: Media[],
  error: Media[];
}
