import { GameID } from '../../GameInterfaces';
import { PlayerID } from '../../client/Client';
import GameServer from '../../game_server/GameServer';
import MessageHandler, { MessageParameters } from './MessageHandler';

interface JoinGameParameters extends MessageParameters {
  playerID?: PlayerID;
  gameID?: GameID;
}

/**
 * Handler for client signal to join the game.
 */
class JoinGame implements MessageHandler<JoinGameParameters> {
  gameServer: GameServer;

  constructor(gameServer: GameServer) {
    this.gameServer = gameServer;
  }

  handleRequest({ client, gameID }: JoinGameParameters): void {
    console.log(`Client attempted to join game with game ID ${gameID}`);
    if (gameID) {
      this.gameServer.joinGame(client, gameID);
    }
  }
}

export default JoinGame;
