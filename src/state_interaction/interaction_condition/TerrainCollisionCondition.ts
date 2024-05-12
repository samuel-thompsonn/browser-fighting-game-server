import InteractionInfo from '../InteractionInfo';
import InteractionCondition from './InteractionCondition';

const hasTerrainCollisions = (conditions: InteractionInfo) => conditions.terrainCollisions;

export default class TerrainCollisionCondition implements InteractionCondition {
  evaluate = hasTerrainCollisions;
}
