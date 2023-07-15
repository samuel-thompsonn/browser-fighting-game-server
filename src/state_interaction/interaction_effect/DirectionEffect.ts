import { Direction } from '../../AnimationUtil';
import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionArgumentResolver from '../InteractionArgumentResolver';
import InteractionEffect from './InteractionEffect';

export default class DirectionEffect implements InteractionEffect {
  #direction: Direction;

  constructor(
    effectArgs: Map<string, InteractionArgumentDescription>,
    argumentResolver: InteractionArgumentResolver,
  ) {
    const directionIdentifier = argumentResolver.resolveArgument(effectArgs, 'direction');
    if (directionIdentifier === 'left') {
      this.#direction = Direction.LEFT;
    } else if (directionIdentifier === 'right') {
      this.#direction = Direction.RIGHT;
    } else {
      throw new Error(`Invalid direction argument ${directionIdentifier} for DirectionEffect`);
    }
  }

  execute(targetCharacter: CharacterInternal): void {
    targetCharacter.setDirection(this.#direction);
  }
}
