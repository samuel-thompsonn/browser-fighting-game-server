import { Position } from './AnimationUtil';
import Character from './Character';

interface GameInternal {
  moveCharacter: (character: Character, deltaPosition: Position) => void
}

export default GameInternal;
