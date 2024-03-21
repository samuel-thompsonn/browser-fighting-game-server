import { GameID } from '../GameInterfaces';
import Client, { PlayerID } from '../client/Client';

interface GameServer {
  createGameInstance(players: PlayerID[]): GameID;
  joinGame(client: Client, gameID: GameID): void;
  handleControlsChange(client: Client, controlsChange: object): void;
  handleForfeit(client: Client): void;
}

export default GameServer;
