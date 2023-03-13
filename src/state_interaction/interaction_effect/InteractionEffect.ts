import CharacterInternal from '../../CharacterInternal';
import InteractionLibrary from '../interaction_data_library/InteractionLibrary';

interface InteractionEffect {
    execute(targetCharacter: CharacterInternal, dataLibrary: InteractionLibrary): void;
}

export default InteractionEffect;
