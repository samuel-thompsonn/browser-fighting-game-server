import { InteractionArgumentDescription } from '../CharacterFileInterface';
import InteractionArgumentResolver from './InteractionArgumentResolver';

function simpleResolveArgument(
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
  throw new Error(`Missing required parameter "${argName}".`);
}

class InteractionArgumentResolverImpl implements InteractionArgumentResolver {
  resolveArgument: (
    effectArgs: Map<string, InteractionArgumentDescription>,
    argName: string,
    defaultValue?: string,
  ) => string;

  constructor() {
    this.resolveArgument = simpleResolveArgument;
  }
}

export default InteractionArgumentResolverImpl;
