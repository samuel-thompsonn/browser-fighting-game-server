import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionArgumentResolver from '../InteractionArgumentResolver';
import InteractionContext from '../interaction_data_library/InteractionLibrary';
import InteractionEffect from './InteractionEffect';

const DEFAULT_KNOCKBACK_STRENGTH = 20;

export default class KnockbackEffect implements InteractionEffect {
  #knockback: string;

  constructor(
    effectArgs: Map<string, InteractionArgumentDescription>,
    argumentResolver: InteractionArgumentResolver,
  ) {
    this.#knockback = argumentResolver.resolveArgument(effectArgs, 'knockback');
  }

  // eslint-disable-next-line class-methods-use-this
  execute(targetCharacter: CharacterInternal, interactionContext: InteractionContext): void {
    const knockbackString = interactionContext.getValue(this.#knockback);
    if (knockbackString) {
      const knockbackValue = parseFloat(knockbackString);
      targetCharacter.changePosition({
        x: DEFAULT_KNOCKBACK_STRENGTH * knockbackValue,
        y: 0,
      });
    }
  }
}
