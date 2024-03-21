import MessageHandler, { MessageParameters } from './MessageHandler';

interface SimpleMessageParameters extends MessageParameters {
  message?: string;
}

const handleMessage = ({ client, socketManager, message }: SimpleMessageParameters) => {
  if (message) {
    console.log(`Received a message from a client: ${JSON.stringify(message)}`);
    // send a response!
    socketManager.sendMessage(client.getPlayerID(), 'echoMessage', { message });
  } else {
    console.log('Received an undefined message from a client.');
  }
};

class SimpleMessageHandler implements MessageHandler<SimpleMessageParameters> {
  handleRequest: (t: SimpleMessageParameters) => void = handleMessage;
}

export default SimpleMessageHandler;
