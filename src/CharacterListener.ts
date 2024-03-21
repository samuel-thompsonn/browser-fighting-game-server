import { CharacterStatus } from './CharacterDataInterfaces';

interface CharacterListener {
  handleCharacterUpdate(newStatus: CharacterStatus): void
}

export default CharacterListener;
