import { InteractionArgumentDescription, InteractionEffectDescription } from '../../CharacterFileInterface';
import InteractionEffect from './InteractionEffect';
import interactionEffectNicknames from './interactionEffectTypes.json';
import * as interactionEffectClasses from './InteractionEffectList';
import InteractionArgumentResolverImpl from '../InteractionArgumentResolverImpl';

function getEffectArgs(
  description: InteractionEffectDescription,
): Map<string, InteractionArgumentDescription> {
  const argMap = new Map<string, InteractionArgumentDescription>();
  description.args.forEach((argDescription) => {
    argMap.set(argDescription.argName, argDescription);
  });
  return argMap;
}

export default class InteractionEffectFactory {
  static instantiateTransitionEffect(
    description: InteractionEffectDescription,
  ): InteractionEffect | undefined {
    let effectClassName: string | undefined;
    interactionEffectNicknames.forEach((effectEntry) => {
      if (effectEntry.nickname === description.effectType) {
        effectClassName = effectEntry.className;
      }
    });
    if (effectClassName) {
      // interactionEffectClasses is an es6 module which exports all classes of effect.
      // So it has a property for each such class. Then we access property
      // effectClassName, which is itself an es6 module. We take
      // its default export, which is a class definition, and call it constructor.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const effectClass = (<any>interactionEffectClasses)[effectClassName]
        .default.prototype.constructor;
      return Reflect.construct(effectClass, [
        getEffectArgs(description),
        new InteractionArgumentResolverImpl(),
      ]);
    }
    return undefined;
  }
}
