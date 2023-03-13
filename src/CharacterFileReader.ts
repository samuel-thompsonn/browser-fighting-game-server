import Character from './Character';
import { SimpleCharacterFileData } from './CharacterFileInterface';

/**
 * Reads a character file to create a character template.
 */
export default abstract class CharacterFileReader {
  abstract readCharacterFile(characterData: SimpleCharacterFileData): Character
}
