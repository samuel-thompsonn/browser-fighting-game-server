import { CollisionEvent } from './GameInterfaces';
import CollisionEntity from './CollisionEntity';

export default abstract class CollisionChecker {
  abstract hasCollision(
    firstCharacterID: string,
    firstCharacterCollisions: CollisionEntity[],
    secondCharacterID: string,
    secondCharacterCollisions: CollisionEntity[],
  ): CollisionEvent | undefined;
}
