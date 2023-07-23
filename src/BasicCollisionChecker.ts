import Character from './Character';
import { CollisionRectangle } from './CharacterFileInterface';
import CollisionEntity from './CollisionEntity';
import { CollisionEvent } from './GameInterfaces';

interface Interval {
  a: number;
  b: number;
}

function intervalsColliding(firstInterval: Interval, secondInterval: Interval): boolean {
  return !(firstInterval.b < secondInterval.a || secondInterval.b < firstInterval.a);
}

function getProjection(collisionBox: CollisionRectangle, axis: 'x'|'y') {
  if (axis === 'x') {
    return { a: collisionBox.x, b: collisionBox.x + collisionBox.width };
  }
  return { a: collisionBox.y, b: collisionBox.y + collisionBox.height };
}

function collidingInAxis(firstBox: CollisionRectangle, secondBox: CollisionRectangle, axis: 'x'|'y'): boolean {
  const firstProjection = getProjection(firstBox, axis);
  const secondProjection = getProjection(secondBox, axis);
  return intervalsColliding(firstProjection, secondProjection);
}

function boxesColliding(firstBox: CollisionRectangle, secondBox: CollisionRectangle): boolean {
  return collidingInAxis(firstBox, secondBox, 'x') && collidingInAxis(firstBox, secondBox, 'y');
}

// Collision rectangles are expressed in terms of their characters'
// dimensions and position. For example, a rectangle with x,y of 0,0
// and width,height of 1,1 has the same position as the character and
// the same width and heigh as the character.
function resolveCollisionRectangle(
  character: Character,
  collisionRectangle: CollisionRectangle,
): CollisionRectangle {
  // TODO: Apply character direction here to flip collisions when facing left.
  //  I think this is not the ideal place for this, though, since directionality
  //  is not inherent to the file definition--just symmetry.
  return {
    x: character.getPosition().x + (collisionRectangle.x * character.getDimensions().width),
    y: character.getPosition().y + (collisionRectangle.y * character.getDimensions().height),
    width: character.getDimensions().width * collisionRectangle.width,
    height: character.getDimensions().height * collisionRectangle.height,
  };
}

function entitiesColliding(
  firstCharacter: Character,
  firstEntity: CollisionEntity,
  secondCharacter: Character,
  secondEntity: CollisionEntity,
): boolean {
  // The current collision code, doesn't actually take into account the positions
  // of the entities! We need to convert the boxes based on the positions and
  // dimensions of the entities.
  let colliding = false;
  // const resolvedFirstEntity = firstCharacter.resolveCollisionEntity(firstEntity);
  // const resolvedSecondEntity = secondCharacter.resolveCollisionEntity(secondEntity);
  firstEntity.getCollisionRectangles().forEach((firstRectangle) => {
    secondEntity.getCollisionRectangles().forEach((secondRectangle) => {
      colliding = colliding || boxesColliding(
        resolveCollisionRectangle(firstCharacter, firstRectangle),
        resolveCollisionRectangle(secondCharacter, secondRectangle),
      );
    });
  });
  return colliding;
}

export default class BasicCollisionChecker {
  static hasCollision(
    firstCharacter: Character,
    firstCharacterCollisions: CollisionEntity[],
    secondCharacter: Character,
    secondCharacterCollisions: CollisionEntity[],
  ): CollisionEvent | undefined {
    let detectedCollision;
    firstCharacterCollisions.forEach((firstCharacterEntity) => {
      secondCharacterCollisions.forEach((secondCharacterEntity) => {
        if (entitiesColliding(
          firstCharacter,
          firstCharacterEntity,
          secondCharacter,
          secondCharacterEntity,
        )) {
          detectedCollision = {
            firstEntity: {
              characterID: firstCharacter.getCharacterID(),
              collisionEntity: firstCharacterEntity,
            },
            secondEntity: {
              characterID: secondCharacter.getCharacterID(),
              collisionEntity: secondCharacterEntity,
            },
          };
        }
      });
    });
    return detectedCollision;
  }
}
