import { CharacterStatus, ResolvedCollisionEvent } from '../CharacterDataInterfaces';

interface InteractionInfo {
  characterID: string;
  currentCollisions: ResolvedCollisionEvent[];
  controlsMap: Map<string, boolean>;
  characterStatus: CharacterStatus;
}

export default InteractionInfo;
