import GameInstance from '../GameInstance';
import { GameID } from '../GameInterfaces';
import GameModel from '../GameModel';
import Client, { PlayerID } from '../client/Client';
import GameInstanceManagerInternal from '../game_instance_manager/GameInstanceManagerInternal';
import SocketManager from '../socket_api/SocketManager';
import GameServer from './GameServer';

const SECONDS_PER_GAME_LOOP = 1 / 30;
const MILLIS_PER_GAME_LOOP = SECONDS_PER_GAME_LOOP * 1000;

/**
 * Manages a collection of game instances.
 */
class GameServerImpl implements GameServer, GameInstanceManagerInternal {
  #gameInstances: Map<GameID, GameInstance>;

  /**
   * Maps clients to the game to which they
   * are presently listening.
   */
  #playersToGameInstances: Map<PlayerID, GameID>;

  #gameCounter: number;

  #socketManager: SocketManager;

  constructor(socketManager: SocketManager) {
    this.#gameInstances = new Map();
    this.#playersToGameInstances = new Map();
    this.#gameCounter = 0;
    this.#socketManager = socketManager;
    this.#initializeGameUpdateInterval();
  }

  #updateGameInstances(): void {
    this.#gameInstances.forEach((gameInstance) => {
      gameInstance.updateGame(SECONDS_PER_GAME_LOOP);
    });
  }

  #initializeGameUpdateInterval(): void {
    setInterval(() => {
      this.#updateGameInstances();
    }, MILLIS_PER_GAME_LOOP);
  }

  createGameInstance(players: string[], isDebug = false): GameID {
    // TODO: Remove reliance on GameModel concrete class
    const gameID = `Game-${this.#gameCounter}`;
    this.#gameCounter += 1;
    this.#gameInstances.set(gameID, new GameModel(
      gameID,
      players,
      this,
      isDebug,
    ));
    return gameID;
  }

  joinGame(client: Client, gameID: GameID) {
    // TODO: Use player identity to determine whether the player
    // can join as a participant rather than a spectator, and
    // make them join as a participant if so.
    // The logic for determining whether they're an element of the game
    // may belong to the game instance though.
    const targetGame = this.#gameInstances.get(gameID);
    console.log(`GameServerImpl: Player ${client.getPlayerID()} attempted to join game ${gameID}. Target game exists: ${!!targetGame}`);
    if (targetGame) {
      // TODO: If a client switches from one game ID to another, they should be removed from
      // the first game ID and we need to notify the target server.
      this.#playersToGameInstances.set(client.getPlayerID(), gameID);
      targetGame.addPlayer(client);
    }
  }

  handleControlsChange(client: Client, controlsChange: object): void {
    console.log(`Game server received controls change from player. playerID: ${client.getPlayerID()}`);
    const gameID = this.#playersToGameInstances.get(client.getPlayerID());
    if (!gameID) {
      // Ignore the player's input because they are not connected
      // to a game instance
      console.log(`Controls change: ${client.getPlayerID()} is not in a game.`);
      return;
    }
    const targetGame = this.#gameInstances.get(gameID);
    if (targetGame) {
      console.log('Controls change: Updating character controls.');
      targetGame.updateCharacterControls(
        client.getPlayerID(),
        controlsChange,
      );
    }
  }

  #getPlayersForGame(gameID: GameID): PlayerID[] {
    const playersInGame: PlayerID[] = [];
    this.#playersToGameInstances.forEach((gameInstanceID, playerID) => {
      if (gameID === gameInstanceID) {
        playersInGame.push(playerID);
      }
    });
    return playersInGame;
  }

  #broadcastToPlayers(gameID: GameID, messageType: string, messageData: unknown = {}): void {
    this.#getPlayersForGame(gameID).forEach((playerID) => {
      this.#socketManager.sendMessage(playerID, messageType, messageData);
    });
  }

  onStartGame(gameID: GameID): void {
    console.log(`Starting game with game ID ${gameID}. Players in game: ${this.#getPlayersForGame(gameID)}`);
    this.#broadcastToPlayers(gameID, 'startGame', { gameStartTime: new Date() });
  }

  onUpdateGameState(gameID: string, data: unknown): void {
    // TODO: Use something other than `updateCharacter` as the generic message type for this
    this.#broadcastToPlayers(gameID, 'updateCharacter', data);
  }

  handleForfeit(client: Client): void {
    const gameID = this.#playersToGameInstances.get(client.getPlayerID());
    if (!gameID) {
      // Ignore the player's input because they are not connected
      // to a game instance
      console.log(`Controls change: ${client.getPlayerID()} is not in a game.`);
      return;
    }
    const gameInstance = this.#gameInstances.get(gameID);
    if (gameInstance) {
      gameInstance.handlePlayerForfeit(client.getPlayerID());
    }
  }

  onGameComplete(gameID: GameID, winnerID: string): void {
    this.#broadcastToPlayers(gameID, 'gameComplete', { winnerID });
  }

  onGameTerminated(gameID: string): void {
    this.#gameInstances.delete(gameID);
  }
}

export default GameServerImpl;
