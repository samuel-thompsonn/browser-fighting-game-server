import { ControlsChange, Position } from './AnimationUtil';
import BasicCollisionChecker from './BasicCollisionChecker';
import Character from './Character';
import CharacterListener from './CharacterListener';
import characterASimple from './character_files/characterASimpleSymmetrical.json';
import GameInstance from './GameInstance';
import SimpleCharacterFileReader from './SimpleCharacterFileReader';
import GameInternal from './GameInternal';

const STAGE_WIDTH = 350;
const STAGE_X_OFFSET = -50;

function applyCharacterMovement(deltaPositions: Map<Character, Position>): void {
  deltaPositions.forEach((deltaPosition: Position, character: Character) => {
    const currentPosition = character.getPosition();
    character.setPosition({
      x: currentPosition.x + deltaPosition.x,
      y: currentPosition.y + deltaPosition.y,
    });
  });
}

function getCharacterPosition(
  characterIndex: number,
  totalCharacters: number,
  stageWidth: number,
  stageOffset: number,
): Position {
  if (characterIndex >= totalCharacters) {
    throw new Error(`Cannot determine position for a character with index ${characterIndex} because there are only ${totalCharacters} players expected.`);
  }
  return {
    x: ((stageWidth / (totalCharacters + 2)) * (characterIndex + 1)) + stageOffset,
    y: 0,
  };
}

export default class GameModel implements GameInstance, GameInternal {
  #numExpectedCharacters: number;

  #characters: Map<string, Character>;

  #characterCounter: number;

  #pendingMovement: Map<Character, Position[]>;

  #characterListeners: Set<CharacterListener>;

  #gameComplete: boolean;

  #onGameStarted: (gameInstance: GameInstance) => void;

  #onGameComplete: (winnerID: string) => void;

  #onGameTerminated: (gameInstance: GameInstance) => void;

  #id: number;

  constructor(
    id: number,
    numExpectedCharacters: number,
    onGameStarted: (gameInstance: GameInstance) => void,
    onGameComplete: (winnerID: string) => void,
    onGameTerminated: (gameInstance: GameInstance) => void,
  ) {
    this.#numExpectedCharacters = numExpectedCharacters;
    this.#characters = new Map<string, Character>();
    this.#pendingMovement = new Map<Character, Position[]>();
    this.#characterCounter = 0;
    this.#characterListeners = new Set<CharacterListener>();
    this.#onGameStarted = onGameStarted;
    this.#onGameComplete = onGameComplete;
    this.#onGameTerminated = onGameTerminated;
    this.#gameComplete = false;
    this.#id = id;
  }

  getID() {
    return this.#id;
  }

  moveCharacter(character: Character, deltaPosition: Position): void {
    if (!this.#pendingMovement.get(character)) {
      this.#pendingMovement.set(character, []);
    }
    this.#pendingMovement.get(character)?.push(deltaPosition);
  }

  addCharacterListener(listener: CharacterListener): void {
    this.#characterListeners.add(listener);
    this.#characters.forEach((character) => {
      character.subscribe(listener);
    });
  }

  removeCharacterListener(listener: CharacterListener): void {
    this.#characterListeners.delete(listener);
  }

  createCharacter(): string {
    console.log(`Game ID: ${this.#id} | Creating new character`);
    // if the game has already started, do not admit characters.
    if (this.#characterCounter >= this.#numExpectedCharacters) {
      console.log(`Game ID: ${this.#id} | Cannot create new character because there are already ${this.#characterCounter} characters.`);
      throw new Error('Failed to create a character: The game has already started!');
    }
    const characterID = `${this.#characterCounter}`;
    const characterTemplate = SimpleCharacterFileReader.readCharacterFile(characterASimple);
    const newCharacterPosition = getCharacterPosition(
      this.#characterCounter,
      this.#numExpectedCharacters,
      STAGE_WIDTH,
      STAGE_X_OFFSET,
    );
    const newCharacter = characterTemplate.createCharacter(characterID, newCharacterPosition);
    this.#characterListeners.forEach((listener) => {
      newCharacter.subscribe(listener);
    });
    this.#characters.set(characterID, newCharacter);
    this.#characterCounter += 1;
    console.log(`Game ID: ${this.#id} | There are now ${this.#characters.size} characters in the game.`); // eslint-disable-line
    if (this.#characterCounter === this.#numExpectedCharacters) {
      this.#onGameStarted(this);
    }
    return characterID;
  }

  removeCharacter(characterID: string): void {
    this.#characters.delete(characterID);
    this.#characterListeners.forEach((listener) => {
      listener.handleCharacterDeleted(characterID);
    });
    console.log(`There are now ${this.#characters.size} characters.`); // eslint-disable-line
  }

  updateCharacterControls(characterID: string, controlsChange: ControlsChange) {
    const targetCharacter = this.#characters.get(characterID);
    if (!targetCharacter) { return; }
    targetCharacter.updateControls(controlsChange);
  }

  updateCharacters(elapsedSeconds: number): void {
    this.#characters.forEach((character) => {
      character.updateSelf(this, { default: 'yes' }, elapsedSeconds);
    });
  }

  getCharacterPositionChanges(): Map<Character, Position> {
    const deltaPositions = new Map<Character, Position>();
    this.#characters.forEach((character) => {
      const positionChange = { x: 0, y: 0 };
      this.#pendingMovement.get(character)?.forEach((deltaPosition) => {
        positionChange.x += deltaPosition.x;
        positionChange.y += deltaPosition.y;
      });
      deltaPositions.set(character, positionChange);
      this.#pendingMovement.set(character, []);
    });
    return deltaPositions;
  }

  registerCollisions(deltaPositions: Map<Character, Position>): void {
    this.#characters.forEach((outerCharacter) => {
      const outerDeltaPosition = deltaPositions.get(outerCharacter);
      if (!outerDeltaPosition) { return; }
      this.#characters.forEach((innerCharacter) => {
        if (innerCharacter === outerCharacter) { return; }
        const innerDeltaPosition = deltaPositions.get(innerCharacter);
        if (!innerDeltaPosition) { return; }
        const outerCollisionData = outerCharacter.getCollisionData();
        const innerCollisionData = innerCharacter.getCollisionData();
        if (!(outerCollisionData && innerCollisionData)) { return; }
        // Check for collisions:
        const detectedCollision = BasicCollisionChecker.hasCollision(
          outerCharacter,
          outerCollisionData,
          innerCharacter,
          innerCollisionData,
        );
        if (!detectedCollision) {
          return;
        }
        innerCharacter.registerCollision(detectedCollision);
        outerCharacter.registerCollision(detectedCollision);
      });
    });
  }

  #getCurrentWinner(): Character | undefined {
    const livingCharacters: Character[] = [];
    const deadCharacters: Character[] = [];
    this.#characters.forEach((character) => {
      if (character.getCurrentHealth() > 0) {
        livingCharacters.push(character);
      } else {
        deadCharacters.push(character);
      }
    });
    if (livingCharacters.length === 1) {
      return livingCharacters[0];
      // Currently risks soft lock in case of all characters dead at once
    }
    return undefined;
  }

  #handleGameComplete(winner: Character): void {
    if (!this.#gameComplete) {
      this.#onGameComplete(winner.getCharacterID());
      setTimeout(() => this.#onGameTerminated(this), 5000);
    }
    this.#gameComplete = true;
  }

  #handleEndConditions(): void {
    const currentWinner = this.#getCurrentWinner();
    if (currentWinner) {
      this.#handleGameComplete(currentWinner);
    }
  }

  updateGame(elapsedSeconds: number): void {
    this.updateCharacters(elapsedSeconds);
    const deltaPositions = this.getCharacterPositionChanges();
    this.registerCollisions(deltaPositions);
    applyCharacterMovement(deltaPositions);
    this.#handleEndConditions();
  }
}
