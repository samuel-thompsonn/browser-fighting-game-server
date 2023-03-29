import CharacterInternal from "../../CharacterInternal";
import InteractionLibrary from "../interaction_data_library/InteractionLibrary";
import InteractionEffect from "./InteractionEffect";

export default class DamageEffect implements InteractionEffect {

    execute(targetCharacter: CharacterInternal, dataLibrary: InteractionLibrary): void {
        targetCharacter.setCurrentHealth(targetCharacter.getCurrentHealth() - 10);
    }
    
}
