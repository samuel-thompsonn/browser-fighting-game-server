import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionEffect from './InteractionEffect';

function resolveArgument(
  effectArgs: Map<string, InteractionArgumentDescription>,
  argName: string,
  defaultValue: string | undefined = undefined,
): string {
  const argDescription = effectArgs.get(argName);
  // For now, everything is interpreted as literal unless I code it otherwise.
  // In the end, there will be a resolver that handles how the parameter
  // is resolved.
  if (argDescription) {
    return argDescription.value;
  }
  if (defaultValue) {
    return defaultValue;
  }
  throw new Error(`NextStateEffect: Missing required parameter "${argName}".`);
}

export default class NextStateEffect implements InteractionEffect {
  #nextStateID: string;

  #resolutionType: string;

  constructor(effectArgs: Map<string, InteractionArgumentDescription>) {
    this.#nextStateID = resolveArgument(effectArgs, 'destination');
    this.#resolutionType = resolveArgument(effectArgs, 'resolutionType', 'afterEnd');
  }

  execute(targetCharacter: CharacterInternal): void {
    targetCharacter.setNextState(this.#nextStateID, this.#resolutionType);
  }
}
