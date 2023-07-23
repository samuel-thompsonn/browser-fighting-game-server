import { ResolvedCollisionEvent } from '../../CharacterDataInterfaces';
import InteractionInfo from '../InteractionInfo';
import MutableInteractionLibrary from '../interaction_data_library/MutableInteractionLibrary';
import InteractionConditionImpl from './InteractionConditionImpl';

function getTargetCollisionEvent(
  collisions: ResolvedCollisionEvent[],
  selfEntityType: string,
  foreignEntityType: string,
): ResolvedCollisionEvent | undefined {
  let targetEvent;
  collisions.forEach((collisionEvent) => {
    if (collisionEvent.selfEntity.type === selfEntityType
    && collisionEvent.otherEntity.type === foreignEntityType) {
      targetEvent = collisionEvent;
    }
  });
  return targetEvent;
}

export default class CollisionCondition extends InteractionConditionImpl {
  #resolveArgument(argName: string) {
    return this.getArgumentValue(argName, 'CollisionCondition');
  }

  evaluateWithArgs(
    conditions: InteractionInfo,
    library: MutableInteractionLibrary,
  ): boolean {
    const selfEntityType = this.#resolveArgument('selfEntity');
    const foreignEntityType = this.#resolveArgument('foreignEntity');
    const targetEvent = getTargetCollisionEvent(
      conditions.currentCollisions,
      selfEntityType,
      foreignEntityType,
    );
    if (targetEvent) {
      const knockbackString = targetEvent.otherEntity.entity.getProperty('knockback');
      console.log(`applied knockback: ${knockbackString}`);
      if (knockbackString) {
        library.set('knockback', knockbackString);
      } else {
        library.set('knockback', '0');
      }
      return true;
    }
    return false;
  }
}
