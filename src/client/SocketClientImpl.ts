import { Socket } from 'socket.io';
import SocketClient from './SocketClient';
import { PlayerID } from './Client';

class SocketClientImpl implements SocketClient {
  #socket: Socket;

  #playerID: PlayerID | undefined;

  constructor(socket: Socket) {
    this.#socket = socket;
  }

  setPlayerID = (playerID: string) => { this.#playerID = playerID; };

  getPlayerID = () => {
    if (this.#playerID) {
      return this.#playerID;
    }
    throw new Error('Requesting player ID from a player that has yet to identify themselves.');
  };

  sendMessage(eventType: string, data: unknown) {
    this.#socket.emit(eventType, data);
  }
}

export default SocketClientImpl;
