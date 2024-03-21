import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import GameServer from '../game_server/GameServer';
import JoinGame from './message_handler/JoinGame';
import MessageHandler, { MessageParameters } from './message_handler/MessageHandler';
import SimpleMessageHandler from './message_handler/SimpleMessageHandler';
import LeaveGameHandler from './message_handler/LeaveGameHandler';
import Client, { PlayerID } from '../client/Client';
import ControlsChange from './message_handler/ControlsChange';
import SocketManager from './SocketManager';
import SocketClientImpl from '../client/SocketClientImpl';
import SocketClient from '../client/SocketClient';
import ForfeitGame from './message_handler/ForfeitGame';

class SocketAPIImpl implements SocketManager {
  #handlers: Map<string, MessageHandler<MessageParameters>>;

  #clients: Map<string, SocketClient>;

  constructor() {
    this.#handlers = new Map();
    this.#clients = new Map();
  }

  configureServer(
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, unknown>,
    gameServer: GameServer,
  ) {
    this.#initializeHandlers(gameServer);
    io.on('connection', (socket) => this.#initializeConnection(socket));
  }

  #initializeConnection(socket: Socket) {
    const socketClient = new SocketClientImpl(socket);
    socket.on('disconnect', () => {
      console.log('Removing connection from the list of connections...');
      this.#clients.delete(socket.id);
    });
    socket.on('sendIdentity', ({ playerID }) => {
      if (playerID === undefined) {
        return;
      }
      // TODO: DANGER! Authentication goes here.
      // TODO: Prevent player from identifying themselves multiple times
      console.log(`Socket API | Client with socket ID ${socket.id} has identified themselves as ${playerID}`);
      socketClient.setPlayerID(playerID);
      this.#clients.set(playerID, socketClient);
      this.#wireHandlers(socket, socketClient);
    });
  }

  #initializeHandlers(gameServer: GameServer): void {
    // TODO: Do this using reflection so I don't have to make
    // this file depend on every message handler.
    this.#handlers.set('joinGame', new JoinGame(gameServer));
    this.#handlers.set('controlsChange', new ControlsChange(gameServer));
    this.#handlers.set('sendMessage', new SimpleMessageHandler());
    this.#handlers.set('disconnect', new LeaveGameHandler());
    this.#handlers.set('forfeitGame', new ForfeitGame(gameServer));
  }

  #wireHandlers(socket: Socket, client: Client): void {
    this.#handlers.forEach((handler, messageType) => {
      this.#wireHandler(socket, client, handler, messageType);
    });
  }

  sendMessage(targetPlayer: PlayerID, messageType: string, data: unknown): void {
    const targetSocketClient = this.#clients.get(targetPlayer);
    targetSocketClient?.sendMessage(messageType, data);
  }

  #wireHandler(
    socket: Socket,
    client: Client,
    handler: MessageHandler<MessageParameters>,
    messageType: string,
  ): void {
    if (client) {
      socket.on(messageType, (data) => {
        handler.handleRequest({
          client,
          socketManager: this,
          ...data,
        });
      });
    } else {
      console.log('Failed to find a client corresponding to the connection!');
    }
  }
}

export default SocketAPIImpl;
