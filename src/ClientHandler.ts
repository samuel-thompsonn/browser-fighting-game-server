import { Socket } from 'socket.io';
import { ControlsChange } from './AnimationUtil';
import { CharacterStatus } from './CharacterDataInterfaces';
import GameListener from './GameListener';

export default class ClientHandler implements GameListener {
  #socket: Socket;

  #characterID: string | undefined;

  #onCreateCharacter: () => string;

  constructor(
    socket:Socket,
    onControlsChange:(characterID:string, controlsChange:ControlsChange) => void,
    onDisconnect:(disconnector:ClientHandler) => void,
    onCreateCharacter:() => string,
    onReset?:() => void,
  ) {
    this.#socket = socket;
    this.#onCreateCharacter = onCreateCharacter;
    this.#characterID = undefined;

    this.#socket.on('disconnect', () => onDisconnect(this));
    this.#socket.on('controlsChange', (controlsChange) => {
      if (this.#characterID) {
        onControlsChange(this.#characterID, controlsChange);
      }
    });
    this.#socket.on('createCharacter', () => {
      if (this.#characterID) {
        return;
      }
      try {
        this.#characterID = this.#onCreateCharacter();
        this.#socket.emit('createdCharacter', { characterID: this.#characterID });
      } catch (err) {
        this.#socket.emit('createCharacterFailed', { reason: err });
      }
    });
    if (onReset) {
      this.#socket.on('resetGame', onReset);
    }
  }

  getCharacterID(): string | undefined {
    return this.#characterID;
  }

  setCharacterID(characterID: string): void {
    this.#characterID = characterID;
  }

  clearCharacterID(): void {
    this.#characterID = undefined;
  }

  handleCharacterUpdate({
    characterID,
    animationState,
    direction,
    position,
    healthInfo,
    collisionInfo,
  }: CharacterStatus): void {
    this.#socket.emit('updateCharacter', {
      id: `${characterID}`,
      direction,
      position,
      state: animationState.id,
      healthInfo,
      collisionInfo,
    });
  }

  handleGameStart(gameStartTime: Date): void {
    this.#socket.emit('gameStarting', {
      gameStartTime,
    });
  }

  handleGameComplete(winnerID: string): void {
    this.#socket.emit('gameComplete', {
      winnerID,
    });
  }

  // TODO: Call this upon game reset
  handleReset(): void {
    this.#socket.emit('gameReset');
  }

  handleCharacterDeleted(characterID: string): void {
    this.#socket.emit('removeCharacter', characterID);
  }

  acceptConnection(): void {
    this.#socket.emit('accepted_connection');
  }
}
