import { CharacterStatus, ResolvedCollisionEvent } from '../CharacterDataInterfaces';

interface InteractionInfo {
  characterID: string;
  currentCollisions: ResolvedCollisionEvent[];
  terrainCollisions: boolean;
  controlsMap: Map<string, boolean>;
  characterStatus: CharacterStatus;
}

export default InteractionInfo;
