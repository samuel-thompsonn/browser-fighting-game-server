import InteractionInfo from '../InteractionInfo';
import MutableInteractionLibrary from '../interaction_data_library/MutableInteractionLibrary';
import InteractionCondition from './InteractionCondition';

export default abstract class InteractionConditionImpl implements InteractionCondition {
  #argumentsMap: Map<string, string>;

  constructor(conditionArgs: Map<string, string>) {
    this.#argumentsMap = conditionArgs;
  }

  protected getArgumentValue(argName: string, conditionType: string) {
    const argValue = this.#argumentsMap.get(argName);
    if (argValue) {
      return argValue;
    }
    throw new Error(`Missing argument ${argName} for interaction condition ${conditionType}.`);
  }

  abstract evaluateWithArgs(
    conditions: InteractionInfo,
    library: MutableInteractionLibrary
  ): boolean;

  evaluate(conditions: InteractionInfo, library: MutableInteractionLibrary): boolean {
    return this.evaluateWithArgs(conditions, library);
  }
}
