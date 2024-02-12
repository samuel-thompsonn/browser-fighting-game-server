import { Position } from './AnimationUtil';
import Character from './Character';
import { AnimationState } from './CharacterFileInterface';

/**
 * Immutable character class information. Acts as a factory for creating
 * instances of the  character.
 */
export default class CharacterTemplate {
  #movementSpeed: number;

  #knockbackStrength: number;

  #maxHealth: number;

  #animationGraph: Map<string, AnimationState>;

  #initialStateID: string;

  constructor(
    movementSpeed: number,
    knockbackStrength: number,
    maxHealth: number,
    animationGraph: Map<string, AnimationState>,
    initialStateID: string,
  ) {
    this.#movementSpeed = movementSpeed;
    this.#knockbackStrength = knockbackStrength;
    this.#maxHealth = maxHealth;
    this.#animationGraph = animationGraph;
    this.#initialStateID = initialStateID;
  }

  createCharacter(characterID: string, startPosition: Position) {
    return new Character(
      characterID,
      startPosition,
      this.#movementSpeed,
      this.#knockbackStrength,
      this.#maxHealth,
      this.#animationGraph,
      this.#initialStateID,
    );
  }
}
