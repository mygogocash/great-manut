export type HttpRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type HttpResponse = {
  ok: boolean;
  status: number;
  json: <T>() => Promise<T>;
  text: () => Promise<string>;
};

export interface HttpAdapter {
  request(url: string, init?: HttpRequestInit): Promise<HttpResponse>;
}

export interface AuthAdapter {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: { access_token: string; refresh_token: string; expires_in: number }): void;
  clearTokens(): void;
}

export interface StoragePersister {
  load(): Promise<string | undefined>;
  save(content: string): Promise<void>;
}

export interface StorageAdapter {
  createPersister(storeId: string): StoragePersister;
}

export interface WebSocketAdapter {
  connect(url: string, protocols?: string[]): WebSocketConnection;
}

export interface WebSocketConnection {
  send(data: string): void;
  close(): void;
  onOpen(handler: () => void): void;
  onMessage(handler: (data: string) => void): void;
  onClose(handler: () => void): void;
  onError(handler: (error: unknown) => void): void;
}
