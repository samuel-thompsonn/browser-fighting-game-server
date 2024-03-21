import GameServer from '../../game_server/GameServer';
import MessageHandler, { MessageParameters } from './MessageHandler';

interface ControlsChangeMessage extends MessageParameters {
  controlsChange?: unknown
}

class ControlsChange implements MessageHandler<ControlsChangeMessage> {
  #gameServer: GameServer;

  constructor(gameServer: GameServer) {
    this.#gameServer = gameServer;
  }

  handleRequest({ client, controlsChange }: ControlsChangeMessage): void {
    console.log(`Received controls change message from socket! controlsChange: ${JSON.stringify(controlsChange)}`);
    if (controlsChange) {
      this.#gameServer.handleControlsChange(client, controlsChange);
    }
  }
}

export default ControlsChange;
