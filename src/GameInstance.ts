import { ControlsChange } from './AnimationUtil';
import GameListener from './GameListener';

interface GameInstance {
  updateGame: (elapsedSeconds: number) => void;
  getID: () => number;
  createCharacter: () => string;
  removeCharacterListener(listener: GameListener): void
  updateCharacterControls(characterID: string, controlsChange: ControlsChange): void
  removeCharacter(characterID: string): void
  addGameListener(listener: GameListener): void
}

export default GameInstance;
