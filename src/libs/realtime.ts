import { IRequest } from './request';
import { Content, Filter, SchemaRawData } from './types';

export const WS_CLOSE_NORMAL = 1000;

export type EventType = 'create' | 'update' | 'delete' | '*';
export type EventCallback<T> = (data: T, event: EventType, error: Error) => void;
export type EventCallbackArray<T> = (data: T[], event: EventType, error: Error) => void;
export type EventCallbackWildcard<T> = (data: T | T[], event: EventType, error: Error) => void;

export interface EventBase {
  id?: number;
  once?: boolean;
  select?: string;
  filter?: Filter;
}

export interface EventConfigCreate extends EventBase {
  event: 'create';
}

export interface EventConfigUpdate extends EventBase {
  event: 'update' | 'delete';
}

export interface EventConfigWildcard extends EventBase {
  event: EventType;
}

export interface EventConfigUpdateItem extends EventBase {
  event: 'update' | 'delete';
  id: number;
}

export interface EventConfigWildcardItem extends EventBase {
  event: EventType;
  id: number;
}

export type EventConfig = EventConfigCreate | EventConfigUpdate | EventConfigWildcard | EventConfigUpdateItem | EventConfigWildcardItem;

export interface EventData {
  ws: WebSocket;
  callback: any;
}


let WS: new (
  url: string,
  protocols?: string | string[],
) => WebSocket


if (typeof window === 'undefined') {
  WS = require('ws');
}

if (typeof window !== 'undefined') {
  WS = WebSocket;
}


export class Realtime {
  private _events: EventData[] = [];
  constructor(protected _data: SchemaRawData, protected _request: IRequest) { }

  on<T = Content>(event: 'create', cb: EventCallback<T>): Promise<this>;
  on<T = Content>(event: 'update', cb: EventCallbackArray<T>): Promise<this>;
  on<T = Content>(event: 'delete', cb: EventCallbackArray<T>): Promise<this>;
  on<T = Content>(event: '*', cb: EventCallbackWildcard<T>): Promise<this>;
  on<T = Content>(event: 'create', id: number, cb: EventCallback<T>): Promise<this>;
  on<T = Content>(event: 'update', id: number, cb: EventCallback<T>): Promise<this>;
  on<T = Content>(event: 'delete', id: number, cb: EventCallback<T>): Promise<this>;
  on<T = Content>(event: EventConfigCreate, cb: EventCallback<T>): Promise<this>;
  on<T = Content>(event: EventConfigUpdate, cb: EventCallbackArray<T>): Promise<this>;
  on<T = Content>(event: EventConfigUpdateItem, cb: EventCallback<T>): Promise<this>;
  on<T = Content>(event: EventConfigWildcardItem, cb: EventCallback<T>): Promise<this>;

  async on<T = Content>(
    eventOrConfig: EventType | EventConfig,
    idOrCallback: number | EventCallbackWildcard<T>,
    cb?: EventCallbackWildcard<T>,
  ): Promise<this> {
    let config: EventConfig;

    if (typeof eventOrConfig !== 'object') {
      config = { event: eventOrConfig };
    } else {
      config = eventOrConfig;
    }

    if (typeof idOrCallback === 'number') {
      config.id = idOrCallback;
      if (typeof cb === 'undefined') {
        throw new Error('Callback is required');
      }
    }

    if (typeof idOrCallback === 'function') {
      cb = idOrCallback;
    }


    const qs = new URLSearchParams();
    qs.append('schema', this._data.name);
    qs.append('event', config.event);
    config.id && qs.append('id', config.id.toString());
    config?.select && qs.append('select', config.select);
    config?.filter && qs.append('filter', JSON.stringify(config.filter));

    const httpProtocol = this._request.baseApiUrl().split('://')[0];
    const wsProtocol = httpProtocol === 'https' ? 'wss' : 'ws';
    const wsDomain = this._request.baseApiUrl().split('://')[1];
    const authToken = await this._request.getAuthToken?.();
    const subProtocol = authToken ? ['Authorization', `${authToken}`] : [];
    const ws = new WS(
      `${wsProtocol}://${wsDomain}/realtime/content?${qs.toString()}`,
      subProtocol,
    );

    const eventData: EventData = {
      ...config,
      ws,
      callback: cb as EventCallbackWildcard<T>,
    }

    this._events.push(eventData);

    ws.onerror = (event) => {
      const className = event.constructor.name;
      if (className === 'ErrorEvent') {
        console.error('WS Error:', (event as ErrorEvent).error);
      }
    }

    ws.onclose = (event) => {
      if (event.code !== WS_CLOSE_NORMAL || event.reason !== '') {
        eventData.callback(null, null, new Error(`WS Closed with code = '${event.code}' and reason = '${event.reason}'`));
      }
      this.off(eventData.callback);
    }

    ws.onmessage = (event) => {
      const data: {
        event: EventType;
        data: T | T[];
      } = JSON.parse(event.data);
      eventData.callback(data.data, data.event);

      if (config.once) {
        this.off(eventData.callback);
      }
    }

    return this;
  }

  off(cb: EventCallbackWildcard<any>): void {
    const eventData = this._events.find(event => event.callback === cb);
    this._events = this._events.filter(event => event.callback !== cb);
    eventData?.ws.close(WS_CLOSE_NORMAL);
  }
}
