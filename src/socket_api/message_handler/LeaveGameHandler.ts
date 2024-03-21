import MessageHandler, { MessageParameters } from './MessageHandler';

const dummyHandleRequest = () => {
  console.log('A player left their current game.');
};

class LeaveGameHandler implements MessageHandler<MessageParameters> {
  handleRequest: (t: MessageParameters) => void = dummyHandleRequest;
}

export default LeaveGameHandler;
