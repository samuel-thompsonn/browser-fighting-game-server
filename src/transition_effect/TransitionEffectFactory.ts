import { TransitionEffectDescription } from '../CharacterFileInterface';
import TransitionEffect from './TransitionEffect';
import effectTypes from './effectTypes.json';
import * as effectClasses from './EffectLibrary';

export default class TransitionEffectFactory {
  static instantiateTransitionEffect(
    description: TransitionEffectDescription,
  ): TransitionEffect | undefined {
    let effectClassName: string | undefined;
    effectTypes.forEach((effectEntry) => {
      if (effectEntry.nickname === description.effectType) {
        effectClassName = effectEntry.className;
      }
    });
    if (effectClassName) {
      // effectClasses is an es6 module which exports all classes of effect.
      // So it has a property for each such class. Then we access property
      // effectClassName, which is itself an es6 module. So then we take
      // its default export, which is a class definition, and take that class
      // definition's constructor and call it.
      // eslint-disable-next-line
      const effectClass = (<any>effectClasses)[effectClassName].default.prototype.constructor;
      return Reflect.construct(effectClass, []);
    }
    return undefined;
  }
}
