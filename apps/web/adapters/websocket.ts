import type { WebSocketAdapter, WebSocketConnection } from "@great-manut/core";

export const browserWebSocketAdapter: WebSocketAdapter = {
  connect(url, protocols) {
    const socket = new WebSocket(url, protocols);
    const handlers = {
      open: () => {},
      message: (_data: string) => {},
      close: () => {},
      error: (_error: unknown) => {},
    };

    socket.addEventListener("open", () => handlers.open());
    socket.addEventListener("message", (event) => handlers.message(String(event.data)));
    socket.addEventListener("close", () => handlers.close());
    socket.addEventListener("error", (event) => handlers.error(event));

    const connection: WebSocketConnection = {
      send(data) {
        socket.send(data);
      },
      close() {
        socket.close();
      },
      onOpen(handler) {
        handlers.open = handler;
      },
      onMessage(handler) {
        handlers.message = handler;
      },
      onClose(handler) {
        handlers.close = handler;
      },
      onError(handler) {
        handlers.error = handler;
      },
    };

    return connection;
  },
};
