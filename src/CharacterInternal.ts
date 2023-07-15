import { Direction, Position } from './AnimationUtil';

interface CharacterInternal {
  getCurrentHealth: () => number;
  setCurrentHealth: (newValue: number) => void;
  getPosition: () => Position;
  setPosition: (newPosition: Position) => void;
  changePosition: (deltaPosition: Position) => void;
  setDirection: (newDirection: Direction) => void;
  setNextState: (stateID: string, resolutionType: string) => void;
  getKnockbackStrength: () => number;
}

export default CharacterInternal;
