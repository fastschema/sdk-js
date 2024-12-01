import { getContentFilterQuery } from './helpers';
import { Realtime } from './realtime';
import { IRequest, RequestData } from './request';
import {
  Content,
  Field,
  ListOptions,
  MediasUploadResult,
  Pagination,
  SchemaRawData,
  SchemaUpdateData,
} from './types';

// const errSchemaNotFound = (name: string) => {
//   throw new Error(
//     `schema ${name} not found, please check the schema name and make sure you have called init()`
//   );
// };

export class Schemas {
  private _schemas: Schema[] = [];

  constructor(private _request: IRequest) {}

  async sync(): Promise<void> {
    const schemas = await this._request.get<SchemaRawData[]>('/schema');
    this._schemas = schemas.map((s) => new Schema(s, this._request));
  }

  has(name: string): boolean {
    return !!this._schemas.find((s) => s.name() === name);
  }

  schema(name?: string): Schema[] | Schema {
    if (name) {
      const schema = this._schemas.find((s) => s.name() === name);
      return (
        schema ??
        new Schema(
          {
            name,
            namespace: '',
            label_field: '',
            fields: [],
          },
          this._request
        )
      );
    }

    return this._schemas;
  }

  async create(schema: SchemaRawData): Promise<Schema> {
    const createdSchema = await this._request.post<SchemaRawData>(
      '/schema',
      schema
    );
    await this.sync();
    return new Schema(createdSchema, this._request);
  }

  async update(name: string, updateData: SchemaUpdateData): Promise<Schema> {
    const updatedSchema = await this._request.put<SchemaRawData>(
      `/schema/${name}`,
      updateData
    );
    await this.sync();
    return new Schema(updatedSchema, this._request);
  }

  async delete(name: string): Promise<void> {
    await this._request.delete(`/schema/${name}`);
    await this.sync();
  }
}

export class Schema extends Realtime {
  constructor(protected _data: SchemaRawData, protected _request: IRequest) {
    super(_data, _request);
  }

  raw(): SchemaRawData {
    return this._data;
  }

  name(): string {
    return this._data.name;
  }

  namespace(): string {
    return this._data.namespace;
  }

  labelField(): string {
    return this._data.label_field;
  }

  fields(): Field[] {
    return this._data.fields;
  }

  disableTimestamp(): boolean {
    return !!this._data.disable_timestamp;
  }

  isSystemSchema(): boolean {
    return !!this._data.is_system_schema;
  }

  isJunctionSchema(): boolean {
    return !!this._data.is_junction_schema;
  }

  create<T = Content>(data: RequestData): Promise<T> {
    return this._request.post<T>(`/content/${this.name()}`, data);
  }

  update<T = Content>(id: number, data: RequestData): Promise<T> {
    return this._request.put<T>(`/content/${this.name()}/${id}`, data);
  }

  delete<T = Content>(id: number): Promise<T> {
    return this._request.delete<T>(`/content/${this.name()}/${id}`);
  }

  get<T = Content>(params: number | string): Promise<T>;
  get<T = Content>(params?: ListOptions): Promise<Pagination<T>>;
  get<T = Content>(
    params?: number | string | ListOptions
  ): Promise<Pagination<T> | T> {
    if (typeof params === 'string') {
      return this._request.get<T>(`/content/${this.name()}/${params}`);
    }

    if (typeof params === 'number') {
      return this._request.get<T>(`/content/${this.name()}/${params}`);
    }

    let qs = getContentFilterQuery(params);
    return this._request.get<Pagination<T>>(
      `/content/${this.name()}${qs ? '?' + qs : ''}`
    );
  }
}

export class FsFile extends Schema {
  async upload(files: File[]): Promise<MediasUploadResult> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file);
    }

    return await this._request.post<MediasUploadResult>(
      '/file/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }
}
