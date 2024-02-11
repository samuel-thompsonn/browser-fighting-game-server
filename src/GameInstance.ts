import { ControlsChange } from './AnimationUtil';
import CharacterListener from './CharacterListener';

interface GameInstance {
  updateGame: (elapsedSeconds: number) => void;
  getID: () => number;
  createCharacter: () => string;
  removeCharacterListener(listener: CharacterListener): void
  updateCharacterControls(characterID: string, controlsChange: ControlsChange): void
  removeCharacter(characterID: string): void
  addCharacterListener(listener: CharacterListener): void
}

export default GameInstance;
