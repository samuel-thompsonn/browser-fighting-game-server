import Client, { PlayerID } from './Client';

interface SocketClient extends Client {
  sendMessage(eventType: string, data: unknown): void;
  setPlayerID(playerID: PlayerID): void;
}

export default SocketClient;
