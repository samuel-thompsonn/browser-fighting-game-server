import { Socket } from 'socket.io';
import { ControlsChange } from './AnimationUtil';
import { CharacterStatus } from './CharacterDataInterfaces';
import CharacterListener from './CharacterListener';
import GameModel from './GameModel';

export default class ClientHandler implements CharacterListener {
  socket: Socket;

  characterID: string | undefined;

  constructor(
    socket:Socket,
    gameInterface:GameModel,
    onDisconnect:(disconnector:ClientHandler) => void,
  ) {
    this.socket = socket;
    this.characterID = undefined;
    socket.on('disconnect', () => onDisconnect(this));
    socket.on('controlsChange', (controlsChange: ControlsChange) => {
      if (this.characterID) {
        gameInterface.updateCharacterControls(this.characterID, controlsChange);
      }
    });
  }

  getCharacterID(): string | undefined {
    return this.characterID;
  }

  setCharacterID(characterID: string): void {
    this.characterID = characterID;
  }

  handleCharacterUpdate({
    characterID,
    animationState,
    position,
    healthInfo,
    collisionInfo,
  }: CharacterStatus): void {
    this.socket.emit('updateCharacter', {
      id: `${characterID}`,
      position,
      state: animationState.id,
      healthInfo,
      collisionInfo,
    });
  }

  handleCharacterDeleted(characterID: string): void {
    this.socket.emit('removeCharacter', characterID);
  }
}
