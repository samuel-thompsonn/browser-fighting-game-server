import { CharacterStatus } from './CharacterDataInterfaces';

interface GameListener {
  handleCharacterUpdate(newStatus: CharacterStatus): void

  handleCharacterDeleted(characterID: string): void

  handleGameComplete(winnerID: string): void

  handleGameStart(gameStartTime: Date): void

  handleReset(): void

  clearCharacterID(): void
}

export default GameListener;
