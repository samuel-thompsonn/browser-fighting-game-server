import {
  ControlsChange,
  Direction,
  Position,
  TransitionInfo,
} from './AnimationUtil';
import {
  AnimationState,
  FileCollisionItem,
  CharacterDimensions,
} from './CharacterFileInterface';
import { CharacterStatus, ResolvedCollisionEvent } from './CharacterDataInterfaces';
import { CollisionEvent } from './GameInterfaces';
import GameInternal from './GameInternal';
import CharacterInternal from './CharacterInternal';
import InteractionInfo from './state_interaction/InteractionInfo';
import CollisionEntity from './CollisionEntity';
import CharacterListener from './CharacterListener';

function getAnimationStateID(animationName: string, orderIndex: number) {
  return `${animationName}${orderIndex + 1}`;
}

const CHARACTER_SIZE = 64;

function movementDirectionToFactor(direction: Direction): number {
  switch (direction) {
    case Direction.LEFT:
      return -1;
    case Direction.RIGHT:
      return 1;
    default:
      throw new Error(`No movement factor defined for direction ${direction}`);
  }
}

const MAX_FRICTION_ACCELERATION = 1600;

const oppositeWithMaximum = (value: number, max: number) => (
  Math.min(Math.abs(value), max) * -Math.sign(value));

const getFrictionAcceleration = (characterVelocity: Position, elapsedSeconds: number) => ({
  x: oppositeWithMaximum(characterVelocity.x / elapsedSeconds, MAX_FRICTION_ACCELERATION),
  y: 0,
});

export default class Character implements CharacterInternal {
  #animationStates: Map<string, AnimationState>;

  #currentState: AnimationState;

  #listeners: CharacterListener[];

  #position: Position;

  #direction: Direction;

  #dimensions: CharacterDimensions;

  #movementSpeed: number;

  #movementAcceleration: number;

  #knockbackStrength: number;

  #controlsMap: Map<string, boolean>;

  #characterID: string;

  #healthInfo: {
    health: number;
    maxHealth: number;
  };

  #currentCollision: ResolvedCollisionEvent | undefined;

  #hasFloorCollision: boolean;

  #nextStateID: string | undefined;

  #deltaPosition: Position;

  #acceleration: Position;

  #velocity: Position;

  constructor(
    characterID: string,
    startPosition: Position,
    movementSpeed: number,
    movementAcceleration: number,
    knockbackStrength: number,
    maxHealth: number,
    animationStates: Map<string, AnimationState>,
    initialStateID: string,
  ) {
    this.#deltaPosition = {
      x: 0,
      y: 0,
    };
    this.#acceleration = { x: 0, y: 0 };
    this.#velocity = { x: 0, y: 0 };
    this.#knockbackStrength = knockbackStrength;
    this.#nextStateID = undefined;
    this.#dimensions = {
      width: CHARACTER_SIZE,
      height: CHARACTER_SIZE,
    };
    this.#controlsMap = new Map<string, boolean>();
    this.#listeners = [];
    this.#characterID = characterID;
    this.#healthInfo = {
      health: maxHealth,
      maxHealth,
    };
    this.#position = startPosition;
    this.#movementSpeed = movementSpeed;
    this.#movementAcceleration = movementAcceleration;
    this.#animationStates = animationStates;
    this.#direction = Direction.LEFT;
    const initialState = this.#animationStates.get(initialStateID);
    if (!initialState) {
      throw new Error(`Initial state ${initialStateID} not found in states map!`);
    }
    this.#currentState = initialState;
    this.#hasFloorCollision = false;
  }

  getCharacterID(): string {
    return this.#characterID;
  }

  getPosition(): Position {
    return this.#position;
  }

  getDimensions(): CharacterDimensions {
    return this.#dimensions;
  }

  setPosition(newPosition: Position): void {
    this.#position = newPosition;
    this.#notifyListeners();
  }

  setVelocity(newVelocity: Position): void {
    this.#velocity = newVelocity;
  }

  changePosition(deltaPosition: Position): void {
    this.#deltaPosition = {
      x: this.#deltaPosition.x + deltaPosition.x,
      y: this.#deltaPosition.y + deltaPosition.y,
    };
  }

  changeAcceleration(deltaAcceleration: Position): void {
    console.log(`Updating acceleration. deltaAcceleration: ${JSON.stringify(deltaAcceleration)}`);
    this.#acceleration = {
      x: this.#acceleration.x + deltaAcceleration.x,
      y: this.#acceleration.y + deltaAcceleration.y,
    };
  }

  setDirection(newDirection: Direction): void {
    this.#direction = newDirection;
  }

  updateControls({ control, status }: ControlsChange): void {
    console.log('Character is processing controls update.');
    this.#controlsMap.set(control, status === 'pressed');
  }

  getCurrentHealth() {
    return this.#healthInfo.health;
  }

  setCurrentHealth(newHealth: number) {
    this.#healthInfo.health = newHealth;
  }

  getKnockbackStrength() {
    return this.#knockbackStrength;
  }

  #handleInteractions() {
    const resolvedCollisions = [];
    if (this.#currentCollision) {
      resolvedCollisions.push(this.#currentCollision);
    }
    const interactionInfo: InteractionInfo = {
      characterID: this.#characterID,
      controlsMap: this.#controlsMap,
      terrainCollisions: this.#hasFloorCollision,
      currentCollisions: resolvedCollisions,
      characterStatus: this.#getCharacterStatus(),
    };
    this.#currentState.interactions?.forEach((interaction) => {
      interaction.execute(this, interactionInfo);
    });
    this.#currentCollision = undefined;
    this.#hasFloorCollision = false;
  }

  updateSelf(
    gameInterface: GameInternal,
    relevantInfo: TransitionInfo,
    elapsedSeconds: number,
  ): void {
    const movementDirectionFactor = movementDirectionToFactor(this.#direction);
    // TODO: Add friction deceleration
    const frictionAcceleration = getFrictionAcceleration(this.#velocity, elapsedSeconds);
    const totalAcceleration = {
      x: (this.#acceleration.x * movementDirectionFactor * this.#movementAcceleration)
        + frictionAcceleration.x,
      y: (this.#acceleration.y * this.#movementAcceleration)
        + frictionAcceleration.y,
    };
    // TODO: Come up with a solution here that separates speed from movement
    //   from speed as a result of getting hit or something (not yet implemented)
    //   so that you can have a max movement speed
    //   Probably need a separate variable for pending movement acceleration vs.
    //   pending environmental acceleration.
    const newVelocity = {
      x: this.#velocity.x + (totalAcceleration.x * elapsedSeconds),
      y: this.#velocity.y + (totalAcceleration.y * elapsedSeconds),
    };
    const newVelocityMagnitude = {
      x: Math.abs(newVelocity.x),
      y: Math.abs(newVelocity.y),
    };
    const newVelocitySign = {
      x: Math.sign(newVelocity.x),
      y: Math.sign(newVelocity.y),
    };
    this.#velocity = {
      x: Math.min(newVelocityMagnitude.x, this.#movementSpeed) * newVelocitySign.x,
      y: newVelocityMagnitude.y * newVelocitySign.y,
    };
    this.#deltaPosition = {
      x: this.#deltaPosition.x + this.#velocity.x * elapsedSeconds,
      y: this.#deltaPosition.y + this.#velocity.y * elapsedSeconds,
    };
    gameInterface.moveCharacter(this, this.#deltaPosition);
    this.#deltaPosition = {
      x: 0,
      y: 0,
    };
    this.#acceleration = { x: 0, y: 0 };
    this.#handleInteractions();
    if (!this.#nextStateID) { return; }
    this.#setState(this.#nextStateID);
  }

  subscribe(listener: CharacterListener) {
    this.#listeners.push(listener);
    this.#notifyListener(listener);
  }

  #getNextStateIDInterrupt(destinationStateID: string): string {
    const currentStateID = this.#currentState.frameInfo.stateID;
    const currentFrameIndex = this.#currentState.frameInfo.frameIndex;
    const currentStateNumFrames = this.#currentState.frameInfo.numFrames;
    if (currentStateID === destinationStateID) {
      return getAnimationStateID(currentStateID, (currentFrameIndex + 1) % currentStateNumFrames);
    }
    return getAnimationStateID(destinationStateID, 0);
  }

  #getNextStateIDAfterEnd(destinationStateID: string): string {
    const currentStateID = this.#currentState.frameInfo.stateID;
    const currentFrameIndex = this.#currentState.frameInfo.frameIndex;
    const currentStateNumFrames = this.#currentState.frameInfo.numFrames;
    if (currentFrameIndex === currentStateNumFrames - 1) {
      return getAnimationStateID(destinationStateID, 0);
    }
    return getAnimationStateID(currentStateID, currentFrameIndex + 1);
  }

  setNextState(stateID: string, resolutionType = 'direct') {
    switch (resolutionType) {
      case 'interrupt':
        this.#nextStateID = this.#getNextStateIDInterrupt(stateID);
        break;
      case 'afterEnd':
        this.#nextStateID = this.#getNextStateIDAfterEnd(stateID);
        break;
      default:
        this.#nextStateID = stateID;
    }
  }

  #setState(newStateID: string) {
    const nextState = this.#animationStates.get(newStateID);
    if (!nextState) {
      throw new Error(`Attempted to transition to undefined state ${newStateID}.`);
    }
    this.#currentState = nextState;
    this.#notifyListeners();
  }

  getCollisionData(): CollisionEntity[] {
    if (this.#currentState.collisions) {
      return this.#currentState.collisions.map(
        (collisionEntity) => this.resolveCollisionEntity(collisionEntity),
      );
    }
    return [];
  }

  #identifyEntities(collisionEvent: CollisionEvent) {
    let selfEntity = collisionEvent.firstEntity;
    let otherEntity = collisionEvent.secondEntity;
    if (collisionEvent.secondEntity.characterID === this.#characterID) {
      selfEntity = collisionEvent.secondEntity;
      otherEntity = collisionEvent.firstEntity;
    }
    return {
      selfEntity,
      otherEntity,
    };
  }

  registerTerrainCollision(): void {
    this.#hasFloorCollision = true;
  }

  registerCollision(collisionEvent: CollisionEvent): void {
    const { selfEntity, otherEntity } = this.#identifyEntities(collisionEvent);
    this.#currentCollision = {
      selfEntity: {
        type: selfEntity.collisionEntity.getEntityType(),
        entity: selfEntity.collisionEntity,
      },
      otherEntity: {
        type: otherEntity.collisionEntity.getEntityType(),
        entity: otherEntity.collisionEntity,
      },
    };
  }

  /**
   * Notifies all listeners of the up-to-date current state
   */
  #notifyListeners(): void {
    this.#listeners.forEach((listener) => this.#notifyListener(listener));
  }

  resolveCollisionEntity(collisionEntity: CollisionEntity): CollisionEntity {
    const collisionItemBuilder = collisionEntity.getCloneBuilder();
    const newRectangles = collisionEntity.getCollisionRectangles().map((rectangle) => ({
      ...rectangle,
      x: 1 - rectangle.x - rectangle.width,
    }));
    collisionItemBuilder.withCollisionRectangles(newRectangles);
    const knockbackProperty = collisionEntity.getProperty('knockback');
    if (knockbackProperty) {
      const reversedKnockback = parseFloat(knockbackProperty) * -1;
      collisionItemBuilder.withCollisionProperty('knockback', `${reversedKnockback}`);
    }
    switch (this.#direction) {
      case (Direction.RIGHT):
        return collisionEntity;
      case (Direction.LEFT):
        return collisionItemBuilder.build();
      default:
        throw new Error(`Invalid direction ${this.#direction}`);
    }
  }

  #serializeCollisions(): FileCollisionItem[] {
    const serializedCollisions: FileCollisionItem[] = [];
    this.#currentState.collisions?.forEach((collisionEntity) => {
      serializedCollisions.push(
        this.resolveCollisionEntity(collisionEntity).getJSONSerialized(),
      );
    });
    return serializedCollisions;
  }

  /**
   * Notifies a listener of the current state
   * @param listener The listener to notify of the current state
   */
  #notifyListener(listener: CharacterListener): void {
    // TODO: Turn the collision entities back into something that is JSON
    // serializeable. Or make a serializer either inside the CollisionEntity
    // class or without. Probably inside right?
    listener.handleCharacterUpdate(this.#getCharacterStatus());
  }

  #getCharacterStatus(): CharacterStatus {
    return {
      characterID: this.#characterID,
      animationState: this.#currentState,
      direction: this.#direction,
      position: this.getPosition(),
      healthInfo: this.#healthInfo,
      collisionInfo: this.#serializeCollisions(),
    };
  }
}
