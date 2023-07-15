import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionArgumentResolver from '../InteractionArgumentResolver';
import InteractionEffect from './InteractionEffect';

export default class NextStateEffect implements InteractionEffect {
  #nextStateID: string;

  #resolutionType: string;

  constructor(
    effectArgs: Map<string, InteractionArgumentDescription>,
    argumentResolver: InteractionArgumentResolver,
  ) {
    this.#nextStateID = argumentResolver.resolveArgument(effectArgs, 'destination');
    this.#resolutionType = argumentResolver.resolveArgument(effectArgs, 'resolutionType', 'afterEnd');
  }

  execute(targetCharacter: CharacterInternal): void {
    targetCharacter.setNextState(this.#nextStateID, this.#resolutionType);
  }
}
