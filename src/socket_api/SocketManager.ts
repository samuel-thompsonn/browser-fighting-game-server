import { PlayerID } from '../client/Client';

interface SocketManager {
  sendMessage(targetClient: PlayerID, messageType: string, data: unknown): void;
}

export default SocketManager;
