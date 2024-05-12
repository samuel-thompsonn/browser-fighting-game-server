import { Direction, Position } from './AnimationUtil';

interface CharacterInternal {
  getCurrentHealth: () => number;
  setCurrentHealth: (newValue: number) => void;
  getPosition: () => Position;
  setPosition: (newPosition: Position) => void;
  changePosition: (deltaPosition: Position) => void;
  changeAcceleration: (deltaAcceleration: Position) => void
  setDirection: (newDirection: Direction) => void;
  setNextState: (stateID: string, resolutionType: string) => void;
  getKnockbackStrength: () => number;
  getDirection: () => Direction
}

export default CharacterInternal;
