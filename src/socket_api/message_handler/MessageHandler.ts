import Client from '../../client/Client';
import SocketManager from '../SocketManager';

export interface MessageParameters {
  client: Client;
  socketManager: SocketManager;
}

interface MessageHandler<MessageParameterType extends MessageParameters> {
  handleRequest: (t: MessageParameterType) => void;
}

export default MessageHandler;
