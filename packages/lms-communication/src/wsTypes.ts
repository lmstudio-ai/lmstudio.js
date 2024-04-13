import { type WebSocket } from "ws";

type Data = string | Buffer | ArrayBuffer | Buffer[];
export interface WsMessageEvent {
  data: Data;
  type: string;
  target: WebSocket;
}
