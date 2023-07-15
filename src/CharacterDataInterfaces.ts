import { Direction, Position } from './AnimationUtil';
import { AnimationState, FileCollisionItem } from './CharacterFileInterface';
import CollisionEntity from './CollisionEntity';

export interface ResolvedCollisionEvent {
  selfEntity: {
    type: string;
    entity: CollisionEntity;
  }
  otherEntity: {
    type: string;
    entity: CollisionEntity;
  }
}

/**
 * Describes the current status of a character, sufficient enough that
 * their future behavior can be predicted unambiguously given their
 * state transition map.
 */
export interface CharacterStatus {
  characterID: string;
  animationState: AnimationState;
  position: Position;
  direction: Direction;
  healthInfo: {
    health: number;
    maxHealth: number;
  }
  collisionInfo?: FileCollisionItem[];
}
