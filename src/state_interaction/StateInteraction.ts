import { InteractionConditionDescription, InteractionEffectDescription, StateInteractionDescription } from '../CharacterFileInterface';
import CharacterInternal from '../CharacterInternal';
import BasicInteractionLibrary from './BasicInteractionLibrary';
import InteractionInfo from './InteractionInfo';
import InteractionCondition from './interaction_condition/InteractionCondition';
import InteractionConditionFactory from './interaction_condition/InteractionConditionFactory';
import InteractionLibrary from './interaction_data_library/InteractionLibrary';
import MutableInteractionLibrary from './interaction_data_library/MutableInteractionLibrary';
import InteractionEffect from './interaction_effect/InteractionEffect';
import InteractionEffectFactory from './interaction_effect/InteractionEffectFactory';

function loadConditions(
  conditionDescriptions: InteractionConditionDescription[],
): InteractionCondition[] {
  const conditions:InteractionCondition[] = [];
  conditionDescriptions.forEach((conditionDescription) => {
    const condition = InteractionConditionFactory.instantiateTransitionCondition(
      conditionDescription,
    );
    if (condition) {
      conditions.push(condition);
    } else {
      throw new Error(`Invalid condition type "${conditionDescription.conditionType}"`);
    }
  });
  return conditions;
}

function loadEffects(
  effectDescriptions: InteractionEffectDescription[],
): InteractionEffect[] {
  const effects:InteractionEffect[] = [];
  effectDescriptions.forEach((effectDescription) => {
    const effect = InteractionEffectFactory.instantiateTransitionEffect(
      effectDescription,
    );
    if (effect) {
      effects.push(effect);
    } else {
      throw new Error(`Invalid effect type "${effectDescription.effectType}"`);
    }
  });
  return effects;
}

export default class StateInteraction {
  #conditions: InteractionCondition[];

  #effects: InteractionEffect[];

  #priority: number;

  constructor(
    description: StateInteractionDescription,
  ) {
    this.#conditions = loadConditions(description.conditions);
    this.#effects = loadEffects(description.effects);
    this.#priority = description.priority;
  }

  getPriority(): number {
    return this.#priority;
  }

  #evaluateConditions(conditions: InteractionInfo): MutableInteractionLibrary | undefined {
    const library = new BasicInteractionLibrary();
    let conditionsMet = true;
    this.#conditions.forEach((condition: InteractionCondition) => {
      conditionsMet = conditionsMet && condition.evaluate(conditions, library);
    });
    if (conditionsMet) {
      return library;
    }
    return undefined;
  }

  #executeEffects(character: CharacterInternal, interactionLibrary: InteractionLibrary): void {
    this.#effects.forEach((effect) => {
      effect.execute(character, interactionLibrary);
    });
  }

  execute(character: CharacterInternal, conditions: InteractionInfo): void {
    const interactionLibrary = this.#evaluateConditions(conditions);
    if (interactionLibrary) {
      this.#executeEffects(character, interactionLibrary);
    }
  }
}
