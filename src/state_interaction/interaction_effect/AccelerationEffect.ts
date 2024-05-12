import { Direction } from '../../AnimationUtil';
import { InteractionArgumentDescription } from '../../CharacterFileInterface';
import CharacterInternal from '../../CharacterInternal';
import InteractionArgumentResolver from '../InteractionArgumentResolver';
import InteractionEffect from './InteractionEffect';

function movementDirectionToFactor(direction: Direction): number {
  switch (direction) {
    case Direction.LEFT:
      return -1;
    case Direction.RIGHT:
      return 1;
    default:
      throw new Error(`No movement factor defined for direction ${direction}`);
  }
}

function parseBoolean(booleanString: string): boolean {
  return Boolean(JSON.parse(booleanString));
}

export default class AccelerationEffect implements InteractionEffect {
  #acceleration: {
    x: number,
    y: number,
  };

  #applyDirection: boolean;

  constructor(
    effectArgs: Map<string, InteractionArgumentDescription>,
    argumentResolver: InteractionArgumentResolver,
  ) {
    this.#acceleration = {
      x: parseFloat(argumentResolver.resolveArgument(effectArgs, 'acceleration', '0')),
      y: parseFloat(argumentResolver.resolveArgument(effectArgs, 'accelerationY', '0')),
    };
    this.#applyDirection = parseBoolean(argumentResolver.resolveArgument(effectArgs, 'applyDirection', 'true'));
  }

  // eslint-disable-next-line class-methods-use-this
  execute(targetCharacter: CharacterInternal): void {
    const directionFactor = this.#applyDirection
      ? movementDirectionToFactor(targetCharacter.getDirection()) : 1;
    targetCharacter.changeAcceleration({
      x: this.#acceleration.x * directionFactor,
      y: this.#acceleration.y,
    });
  }
}
