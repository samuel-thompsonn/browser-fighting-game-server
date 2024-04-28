import { GameID } from '../GameInterfaces';
import Client, { PlayerID } from '../client/Client';

interface GameServer {
  createGameInstance(players: PlayerID[], isDebug?: boolean): GameID;
  joinGame(client: Client, gameID: GameID): void;
  handleControlsChange(client: Client, controlsChange: object): void;
  handleForfeit(client: Client): void;
  createNewCharacterForPlayer(client: Client, gameID: GameID, characterData: unknown): void;
}

export default GameServer;
