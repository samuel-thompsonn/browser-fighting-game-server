import { CollisionProperty, CollisionRectangle, FileCollisionItem } from './CharacterFileInterface';
import CollisionEntityBuilder from './CollisionEntityBuilder';

export default class CollisionEntity {
  #collisionProperties: Map<string, string>;

  #collisionRectangles: CollisionRectangle[];

  #entityType: string;

  constructor(
    entityType: string,
    collisionProperties: Map<string, string>,
    collisionRectangles: CollisionRectangle[],
  ) {
    this.#entityType = entityType;
    this.#collisionProperties = collisionProperties;
    this.#collisionRectangles = collisionRectangles;
  }

  getProperty(propertyID: string): string | undefined {
    return this.#collisionProperties.get(propertyID);
  }

  getCollisionRectangles(): CollisionRectangle[] {
    return this.#collisionRectangles;
  }

  getEntityType(): string {
    return this.#entityType;
  }

  getCloneBuilder(): CollisionEntityBuilder {
    return new CollisionEntityBuilder()
      .withCollisionProperties(new Map(this.#collisionProperties))
      .withCollisionRectangles(this.#collisionRectangles)
      .withEntityType(this.#entityType);
  }

  getJSONSerialized(): FileCollisionItem {
    const returnedProperties:CollisionProperty[] = [];
    this.#collisionProperties.forEach((propertyValue, propertyName) => {
      returnedProperties.push({
        propertyName,
        propertyValue,
      });
    });
    return {
      entityType: this.#entityType,
      properties: returnedProperties,
      rectangles: this.#collisionRectangles,
    };
  }
}
