import InteractionInfo from "../InteractionInfo";
import MutableInteractionLibrary from "../interaction_data_library/MutableInteractionLibrary";
import InteractionCondition from "./InteractionCondition";

const HEALTH_THRESHOLD_KEY = 'healthThreshold';

/**
 * Checks for character having a specific amount of health or less.
 */
export default class HealthCondition implements InteractionCondition {

    #healthThreshold: number;

    constructor(conditionArgs: Map<string, string>) {
        const healthThreshold = conditionArgs.get(HEALTH_THRESHOLD_KEY);
        if (healthThreshold) {
          this.#healthThreshold = parseInt(healthThreshold);
        } else {
          throw new Error(`Missing argument ${HEALTH_THRESHOLD_KEY} for interaction condition HealthCondition.`);
        }
    }

    evaluate(conditions: InteractionInfo, library: MutableInteractionLibrary): boolean {
        return (conditions.characterStatus.healthInfo.health <= this.#healthThreshold);
    }
}
