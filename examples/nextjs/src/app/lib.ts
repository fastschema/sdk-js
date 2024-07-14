import { FastSchema } from 'fastschema';

export interface Tag {
  id: number;
  name: string;
  description: string;
}

export interface Blog {
  id: number;
  name: string;
  content: string;
  tags?: Tag[];
}

export const loginData = {
  login: 'admin',
  password: '123',
};

export const defaultTagData = {
  id: 0,
  name: '',
  description: '',
};

export const defaultBlogData = {
  id: 0,
  name: '',
  content: '',
};

export const createFs = async () => {
  const fs = new FastSchema('http://127.0.0.1:8000');
  await fs.auth().login(loginData);
  await fs.init();
  return fs;
}
