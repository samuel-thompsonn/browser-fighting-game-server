import Character from './Character';
import { ResolvedCollisionEvent } from './CharacterDataInterfaces';

interface CollisionTransition {
  handleCollision: (collisionEvent: ResolvedCollisionEvent, character: Character) => void;
}

export default CollisionTransition;
