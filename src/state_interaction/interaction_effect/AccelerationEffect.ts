import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionArgumentResolver from '../InteractionArgumentResolver';
import InteractionContext from '../interaction_data_library/InteractionLibrary';
import InteractionEffect from './InteractionEffect';

export default class AccelerationEffect implements InteractionEffect {
  #acceleration: {
    x: number,
    y: number,
  };

  constructor(
    effectArgs: Map<string, InteractionArgumentDescription>,
    argumentResolver: InteractionArgumentResolver,
  ) {
    this.#acceleration = {
      x: parseFloat(argumentResolver.resolveArgument(effectArgs, 'acceleration', '0')),
      y: parseFloat(argumentResolver.resolveArgument(effectArgs, 'accelerationY', '0')),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  execute(targetCharacter: CharacterInternal): void {
    targetCharacter.changeAcceleration({ ...this.#acceleration });
  }
}
