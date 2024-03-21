import GameServer from '../../game_server/GameServer';
import MessageHandler, { MessageParameters } from './MessageHandler';

class ForfeitGame implements MessageHandler<MessageParameters> {
  #gameServer: GameServer;

  constructor(gameServer: GameServer) {
    this.#gameServer = gameServer;
  }

  handleRequest({ client }: MessageParameters): void {
    console.log('Received forfiet change message from socket!');
    this.#gameServer.handleForfeit(client);
  }
}

export default ForfeitGame;
