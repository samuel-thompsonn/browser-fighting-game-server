import { InteractionArgumentDescription } from '../CharacterFileInterface';

interface InteractionArgumentResolver {
    resolveArgument: (
        effectArgs: Map<string, InteractionArgumentDescription>,
        argName: string,
        defaultValue?: string,
    ) => string
}

export default InteractionArgumentResolver;
