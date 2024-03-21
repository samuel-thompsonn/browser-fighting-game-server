import { GameID } from '../GameInterfaces';

interface GameInstanceManagerInternal {
  // sendMessage(gameID: GameID, client: Client, messageType: string, messageData: unknown): void;
  onStartGame(gameID: GameID): void;
  onUpdateGameState(gameID: GameID, data: unknown): void;
  onGameComplete(gameID: GameID, winnerID: string): void;

  /**
   * onGameComplete means that a winner is declared. onGameTerminated
   * means that the game is shutting down and should no longer
   * use memory/compute resources or communicate with clients.
   * This allows games to have an interactible victory screen.
   */
  onGameTerminated(gameID: GameID): void;
}

export default GameInstanceManagerInternal;
