import { GameID } from './GameInterfaces';
import GameListener from './GameListener';
import Client from './client/Client';

interface GameInstance {
  updateGame: (elapsedSeconds: number) => void;
  getID: () => GameID;
  removeCharacterListener(listener: GameListener): void
  updateCharacterControls(characterID: string, controlsChange: object): void
  removeCharacter(characterID: string): void
  addPlayer(client: Client): void
  createNewCharacterForPlayer(client: Client, characterData: unknown): void
  handlePlayerForfeit(playerID: string): void
}

export default GameInstance;
