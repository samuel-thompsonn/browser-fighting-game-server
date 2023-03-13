import { CharacterStatus } from './CharacterDataInterfaces';

export default abstract class CharacterListener {
  abstract handleCharacterUpdate(newStatus: CharacterStatus): void

  abstract handleCharacterDeleted(characterID: string): void
}
