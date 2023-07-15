import { CollisionRectangle } from './CharacterFileInterface';
import CollisionEntity from './CollisionEntity';

export default class CollisionEntityBuilder {
  private collisionProperties: Map<string, string>|undefined;

  private collisionRectangles: CollisionRectangle[]|undefined;

  private entityType: string|undefined;

  public withCollisionProperties(collisionProperties: Map<string, string>): CollisionEntityBuilder {
    this.collisionProperties = collisionProperties;
    return this;
  }

  public withCollisionRectangles(
    collisionRectangles: CollisionRectangle[],
  ): CollisionEntityBuilder {
    this.collisionRectangles = collisionRectangles;
    return this;
  }

  public withEntityType(entityType: string): CollisionEntityBuilder {
    this.entityType = entityType;
    return this;
  }

  public build(): CollisionEntity {
    if (this.collisionProperties === undefined) {
      throw new Error('Cannot build CollisionEntity: collisionProperties are not defined.');
    }
    if (this.entityType === undefined) {
      throw new Error('Cannot build CollisionEntity: entityType is not defined.');
    }
    if (this.collisionRectangles === undefined) {
      throw new Error('Cannot build CollisionEntity: collisionRectangles are not defined.');
    }
    return new CollisionEntity(
      this.entityType,
      this.collisionProperties,
      this.collisionRectangles,
    );
  }
}
