import Character from '../Character';
import { ResolvedCollisionEvent } from '../CharacterDataInterfaces';

interface TransitionEffect {
  execute: (collisionEvent: ResolvedCollisionEvent, character: Character) => void;
}

export default TransitionEffect;
