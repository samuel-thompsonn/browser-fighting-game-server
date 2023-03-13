import { InteractionConditionDescription } from '../../CharacterFileInterface';
import InteractionCondition from './InteractionCondition';
import interactionConditionNicknames from './interactionConditionTypes.json';
import * as interactionConditionClasses from './InteractionConditionList';

function getConditionArgs(description: InteractionConditionDescription): Map<string, string> {
  const argMap = new Map<string, string>();
  description.args.forEach((argDescription) => {
    argMap.set(argDescription.argName, argDescription.value);
  });
  return argMap;
}

export default class InteractionConditionFactory {
  static instantiateTransitionCondition(
    description: InteractionConditionDescription,
  ): InteractionCondition | undefined {
    let effectClassName: string | undefined;
    interactionConditionNicknames.forEach((conditionEntry) => {
      if (conditionEntry.nickname === description.conditionType) {
        effectClassName = conditionEntry.className;
      }
    });
    if (effectClassName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const effectClass = (<any>interactionConditionClasses)[effectClassName]
        .default.prototype.constructor;
      return Reflect.construct(effectClass, [getConditionArgs(description)]);
    }
    return undefined;
  }
}
