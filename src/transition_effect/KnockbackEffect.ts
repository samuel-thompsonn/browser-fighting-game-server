import Character from '../Character';
import { ResolvedCollisionEvent } from '../CharacterDataInterfaces';
import TransitionEffect from './TransitionEffect';

const DEFAULT_KNOCKBACK_STRENGTH = 20;

export default class KnockbackEffect implements TransitionEffect {
  // eslint-disable-next-line
  execute(collisionEvent: ResolvedCollisionEvent, character: Character): void {
    const knockbackString = collisionEvent.otherEntity.entity.getProperty('knockback');
    if (knockbackString) {
      const knockback = parseFloat(knockbackString);
      character.changePosition({
        x: DEFAULT_KNOCKBACK_STRENGTH * knockback,
        y: 0,
      });
    }
  }
}
