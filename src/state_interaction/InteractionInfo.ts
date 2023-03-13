import { ResolvedCollisionEvent } from '../CharacterDataInterfaces';

interface InteractionInfo {
  characterID: string;
  currentCollisions: ResolvedCollisionEvent[];
  controlsMap: Map<string, boolean>;
}

export default InteractionInfo;
