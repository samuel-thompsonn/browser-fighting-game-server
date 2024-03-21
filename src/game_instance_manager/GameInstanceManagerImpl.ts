import GameInstance from '../GameInstance';
import GameListener from '../GameListener';
import GameModel from '../GameModel';
import GameInstanceManager from './GameInstanceManager';

const addClientDummy = (clientHandler: GameListener) => {
  console.log('Dummy stub for addClient called');
};

class GameInstanceManagerImpl implements GameInstanceManager {
  // #gameInstance: GameInstance;

  #gameInterval: NodeJS.Timer | undefined;

  #gameID: number;

  #gameListeners: GameListener[];

  #millisForGameStart: number;

  #secondsPerGameLoop: number;

  constructor(
    expectedPlayerIdentities: string[],
    millisForGameStart: number,
    secondsPerGameLoop: number,
  ) {
    this.#gameListeners = [];
    this.#millisForGameStart = millisForGameStart;
    this.#secondsPerGameLoop = secondsPerGameLoop;
    this.#gameID = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    // this.#gameInstance = new GameModel(
    //   this.#gameID,
    //   expectedPlayerIdentities.length,
    //   this.#onGameStarted,
    //   this.#onGameComplete,
    //   this.#onGameTerminated,
    // );
  }

  addClient: (clientHandler: GameListener) => void = addClientDummy;

  getGameID() {
    return this.#gameID;
  }

  #onGameStarted(gameInstance: GameInstance) {
    console.log(`All players are now connected. Starting game in ${this.#millisForGameStart} millis.`);
    const millisPerGameLoop = this.#secondsPerGameLoop * 1000;
    setTimeout(() => {
      console.log('Starting the game simulation.');
      this.#gameInterval = setInterval(
        () => gameInstance.updateGame(this.#secondsPerGameLoop),
        millisPerGameLoop,
      );
    }, millisPerGameLoop);
    const gameStartTime = new Date(new Date().getTime() + this.#millisForGameStart);
    this.#gameListeners.forEach((gameListener) => gameListener.handleGameStart(gameStartTime));
  }

  #onGameComplete(winnerID: string): void {
    this.#gameListeners.forEach((gameListener) => {
      gameListener.handleGameComplete(winnerID);
    });
  }

  #onGameTerminated() {
    if (this.#gameInterval !== undefined) {
      clearInterval(this.#gameInterval);
    }
  }
}

export default GameInstanceManagerImpl;
