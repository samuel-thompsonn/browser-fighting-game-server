import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionContext from '../interaction_data_library/InteractionLibrary';
import InteractionEffect from './InteractionEffect';

const DEFAULT_KNOCKBACK_STRENGTH = 20;

// DUPLICATED CODE!
function resolveArgument(
  effectArgs: Map<string, InteractionArgumentDescription>,
  argName: string,
  defaultValue: string | undefined = undefined,
): string {
  const argDescription = effectArgs.get(argName);
  if (argDescription) {
    return argDescription.value;
  }
  if (defaultValue) {
    return defaultValue;
  }
  throw new Error(`NextStateEffect: Missing required parameter "${argName}".`);
}

export default class KnockbackEffect implements InteractionEffect {
  #knockback: string;

  constructor(effectArgs: Map<string, InteractionArgumentDescription>) {
    this.#knockback = resolveArgument(effectArgs, 'knockback');
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
