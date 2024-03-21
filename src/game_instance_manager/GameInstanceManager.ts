import GameListener from '../GameListener';

interface GameInstanceManager {
  getGameID: () => number;
  addClient: (clientHandler: GameListener) => void;
}

export default GameInstanceManager;
