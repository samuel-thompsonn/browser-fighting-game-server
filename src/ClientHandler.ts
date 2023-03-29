import { Socket } from 'socket.io';
import { ControlsChange } from './AnimationUtil';
import { CharacterStatus } from './CharacterDataInterfaces';
import CharacterListener from './CharacterListener';
import GameModel from './GameModel';

export default class ClientHandler implements CharacterListener {
  #socket: Socket;

  #characterID: string | undefined;

  #onCreateCharacter: () => string;

  constructor(
    socket:Socket,
    gameInterface:GameModel,
    onDisconnect:(disconnector:ClientHandler) => void,
    onCreateCharacter:() => string,
  ) {
    this.#socket = socket;
    this.#onCreateCharacter = onCreateCharacter;
    this.#characterID = undefined;

    this.#socket.on('disconnect', () => onDisconnect(this));
    this.#socket.on('controlsChange', (controlsChange: ControlsChange) => {
      if (this.#characterID) {
        gameInterface.updateCharacterControls(this.#characterID, controlsChange);
      }
    });
    this.#socket.on('createCharacter', () => {
      if (this.#characterID) {
        return;
      }
      this.#characterID = this.#onCreateCharacter();
    });
  }

  getCharacterID(): string | undefined {
    return this.#characterID;
  }

  setCharacterID(characterID: string): void {
    this.#characterID = characterID;
  }

  handleCharacterUpdate({
    characterID,
    animationState,
    position,
    healthInfo,
    collisionInfo,
  }: CharacterStatus): void {
    this.#socket.emit('updateCharacter', {
      id: `${characterID}`,
      position,
      state: animationState.id,
      healthInfo,
      collisionInfo,
    });
  }

  handleGameComplete(winnerID: string): void {
    this.#socket.emit('gameComplete', {
      winnerID: winnerID
    });
  }

  handleCharacterDeleted(characterID: string): void {
    this.#socket.emit('removeCharacter', characterID);
  }

  acceptConnection(): void {
    this.#socket.emit("accepted_connection");
  }
}
