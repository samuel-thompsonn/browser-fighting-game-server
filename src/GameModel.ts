import { ControlsChange, Position } from './AnimationUtil';
import BasicCollisionChecker from './BasicCollisionChecker';
import Character from './Character';
import GameListener from './GameListener';
import characterASimple from './character_files/characterASimpleSymmetrical.json';
import GameInstance from './GameInstance';
import SimpleCharacterFileReader from './SimpleCharacterFileReader';
import GameInternal from './GameInternal';
import { GameID } from './GameInterfaces';
import GameInstanceManagerInternal from './game_instance_manager/GameInstanceManagerInternal';
import Client, { PlayerID } from './client/Client';
import CharacterListener from './CharacterListener';
import { CharacterStatus } from './CharacterDataInterfaces';

const STAGE_WIDTH = 350;
const STAGE_X_OFFSET = -50;

function applyCharacterMovement(deltaPositions: Map<Character, Position>): void {
  deltaPositions.forEach((deltaPosition: Position, character: Character) => {
    const currentPosition = character.getPosition();
    if (character.getCharacterID() === 'PlayerID1') {
      // console.log(`deltaPosition for character PlayerID1: ${JSON.stringify(deltaPosition)}`);
    }
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

export default class GameModel implements GameInstance, GameInternal, CharacterListener {
  #expectedPlayers: string[];

  #characters: Map<string, Character>;

  #characterCounter: number;

  #pendingMovement: Map<Character, Position[]>;

  #gameListeners: Set<GameListener>;

  #playersAndSpectators: Set<PlayerID>;

  #gameComplete: boolean;

  #id: GameID;

  #gameInstanceManagerInternal: GameInstanceManagerInternal;

  // Could also be gameState as an enum of NOT_STARTED, STARTED, COMPLETE
  #active: boolean;

  constructor(
    id: GameID,
    expectedPlayers: PlayerID[],
    gameInstanceManagerInternal: GameInstanceManagerInternal,
  ) {
    // TODO: Extract logic for managing player count
    //   to game instance manager
    this.#expectedPlayers = expectedPlayers;
    this.#characters = new Map<string, Character>();
    this.#pendingMovement = new Map<Character, Position[]>();
    this.#characterCounter = 0;
    this.#gameListeners = new Set<GameListener>();
    this.#playersAndSpectators = new Set<PlayerID>();
    this.#gameComplete = false;
    this.#id = id;
    this.#gameInstanceManagerInternal = gameInstanceManagerInternal;
    this.#active = false;
  }

  addPlayer(client: Client) {
    console.log(`Game ID: ${this.#id} | Adding player ${client.getPlayerID()}`);
    this.#playersAndSpectators.add(client.getPlayerID());
    console.log(`Game ID: ${this.#id} | There are now ${this.#playersAndSpectators.size} players spectating or participating. Number of players needed to start the game: ${this.#expectedPlayers.length}`); // eslint-disable-line
    if (this.#expectedPlayers.includes(client.getPlayerID())) {
      // TODO: Assign character ID to player ID so that controls are routed appropriately
      this.#characters.set(client.getPlayerID(), this.#createCharacter(client.getPlayerID()));
    }
    if (this.#playersAndSpectators.size === this.#expectedPlayers.length) {
      console.log(`Game ID: ${this.#id} | All players connected. Starting the game...`);
      // TODO: Send timer for game start time instead of starting game immediately
      this.#gameInstanceManagerInternal.onStartGame(this.#id);
      this.#active = true;
    }
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

  removeCharacterListener(listener: GameListener): void {
    this.#gameListeners.delete(listener);
  }

  #createCharacter(characterID: string): Character {
    if (this.#active) {
      console.log(`Game ID: ${this.#id} | Cannot create new character because there are already ${this.#characterCounter} characters.`);
      throw new Error('Failed to create a character: The game has already started!');
    }
    console.log(`Game ID: ${this.#id} | Creating new character`);
    const characterTemplate = SimpleCharacterFileReader.readCharacterFile(characterASimple);
    // TODO: Probably want to remove characterCounter and just use this.#characters.size
    const newCharacterPosition = getCharacterPosition(
      this.#characterCounter,
      this.#expectedPlayers.length,
      STAGE_WIDTH,
      STAGE_X_OFFSET,
    );
    this.#characterCounter += 1;
    const newCharacter = characterTemplate.createCharacter(characterID, newCharacterPosition);
    newCharacter.subscribe(this);
    console.log(`Game ID: ${this.#id} | There are now ${this.#characters.size} characters in the game.`); // eslint-disable-line
    return newCharacter;
  }

  removeCharacter(characterID: string): void {
    this.#characters.delete(characterID);
    this.#gameListeners.forEach((listener) => {
      listener.handleCharacterDeleted(characterID);
    });
    console.log(`There are now ${this.#characters.size} characters.`); // eslint-disable-line
  }

  /**
   * Assumes that the incoming message is a controlsChange
   * @param characterID ID of the character whose controls changed
   * @param controlsChange The description of changed keys
   */
  updateCharacterControls(characterID: string, controlsChange: ControlsChange): void {
    const targetCharacter = this.#characters.get(characterID);
    console.log(`GameModel: Updating character controls. characterID: ${characterID}. controlsChange: ${JSON.stringify(controlsChange)}. targetCharacter: ${targetCharacter}`);
    if (!targetCharacter) {
      return;
    }
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
      this.#gameInstanceManagerInternal.onGameComplete(this.#id, winner.getCharacterID());
      setTimeout(() => this.#gameInstanceManagerInternal.onGameTerminated(this.#id), 5000);
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
    console.log('Running game update loop.');
    if (!this.#active) {
      return;
    }
    this.updateCharacters(elapsedSeconds);
    const deltaPositions = this.getCharacterPositionChanges();
    this.registerCollisions(deltaPositions);
    applyCharacterMovement(deltaPositions);
    this.#handleEndConditions();
  }

  handleCharacterUpdate({
    characterID,
    animationState,
    direction,
    position,
    healthInfo,
    collisionInfo,
  }: CharacterStatus): void {
    this.#gameInstanceManagerInternal.onUpdateGameState(this.#id, {
      id: `${characterID}`,
      direction,
      position,
      state: animationState.id,
      healthInfo,
      collisionInfo,
    });
  }

  handlePlayerForfeit(playerID: string): void {
    console.log(`PLayer ${playerID} forfeited.`);
    // count their character as defeated.
    // if that ends the game, the end game logic should handle it.
    // for now, we can just hack it by setting thier health to 0.
    this.#characters.get(playerID)?.setCurrentHealth(0);
  }
}
