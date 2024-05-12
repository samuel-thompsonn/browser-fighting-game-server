import {
  AnimationState,
  FileAnimationDescription,
  SimpleCharacterFileData,
  FileCollisionItem,
  StateInteractionDescription,
} from './CharacterFileInterface';
import CharacterTemplate from './CharacterTemplate';
import CollisionEntity from './CollisionEntity';
import AttackDescriptionReader from './animation_description_reader/AttackDescriptionReader';
import FileAttackAnimationDescription from './animation_description_reader/FileAttackAnimationDescription';
import StateInteraction from './state_interaction/StateInteraction';

function getAnimationStateID(animationName: string, orderIndex: number) {
  return `${animationName}${orderIndex + 1}`;
}

function loadCollisionEntities(collisionData: FileCollisionItem[]): CollisionEntity[] {
  const collisionEntities:CollisionEntity[] = [];
  collisionData.forEach((collisionEntityData) => {
    const collisionProperties = new Map<string, string>();
    collisionEntityData.properties?.forEach((collisionProperty) => {
      collisionProperties.set(collisionProperty.propertyName, collisionProperty.propertyValue);
    });
    collisionEntities.push(new CollisionEntity(
      collisionEntityData.entityType,
      collisionProperties,
      collisionEntityData.rectangles,
    ));
  });
  return collisionEntities;
}

function getStateInteractions(
  animationDescription: FileAnimationDescription,
  globalInteractionsMap: Map<string, StateInteractionDescription>,
): StateInteraction[] {
  const interactions:StateInteraction[] = [];
  if (animationDescription.state.importedInteractions) {
    animationDescription.state.importedInteractions.forEach((importedInteraction) => {
      const interactionDescription = globalInteractionsMap.get(importedInteraction.id);
      if (interactionDescription) {
        interactions.push(new StateInteraction(
          { ...interactionDescription, priority: importedInteraction.priority },
        ));
      } else {
        throw new Error(`Reference to undefined global interaction ${importedInteraction.id}`);
      }
    });
  }
  if (animationDescription.state.interactions) {
    animationDescription.state.interactions.forEach((interactionDescription) => {
      interactions.push(new StateInteraction(interactionDescription));
    });
  }
  interactions.sort((a, b) => a.getPriority() - b.getPriority());
  return interactions;
}

function getGlobalInteractionsMap(
  globalInteractions: StateInteractionDescription[],
): Map<string, StateInteractionDescription> {
  const returnedMap = new Map<string, StateInteractionDescription>();
  globalInteractions.forEach((interactionDescription) => {
    if (interactionDescription.id) {
      returnedMap.set(interactionDescription.id, interactionDescription);
    }
  });
  return returnedMap;
}

function getAnimationState(
  animationDescription: FileAnimationDescription,
  frameIndex: number,
  globalInteractionsMap: Map<string, StateInteractionDescription>,
): AnimationState {
  const id = getAnimationStateID(animationDescription.id, frameIndex);

  let stateCollisions;
  if (animationDescription.state.collisions) {
    stateCollisions = loadCollisionEntities(animationDescription.state.collisions);
  }

  const stateInteractions = getStateInteractions(animationDescription, globalInteractionsMap);

  return {
    id,
    frameInfo: {
      frameIndex,
      numFrames: animationDescription.numFrames,
      stateID: animationDescription.id,
    },
    interactions: stateInteractions,
    collisions: stateCollisions,
  };
}

function getAnimationStates(
  animationDescription: FileAnimationDescription,
  globalInteractionsMap: Map<string, StateInteractionDescription>,
): AnimationState[] {
  const generatedStates:AnimationState[] = [];
  for (let i = 0; i < animationDescription.numFrames; i += 1) {
    generatedStates.push(getAnimationState(animationDescription, i, globalInteractionsMap));
  }
  return generatedStates;
}

/**
 * Transforms a FileAnimationDescription to a string-identified set
 * of AnimationStates.
 * @param characterData An array of FileAnimationDescriptions describing a
 * character's animations.
 * @returns A map from the ID of animation states to the animation states
 * they represent. If the description of an animation has name X, then the states
 * will be given names X1, X2, ....
 */
function getAnimationGraph(
  characterData: (FileAnimationDescription | FileAttackAnimationDescription)[],
  globalInteractionsMap: Map<string, StateInteractionDescription>,
): Map<string, AnimationState> {
  const animationMap = new Map<string, AnimationState>();
  characterData.forEach((animationDescription) => {
    let generatedStates;
    if (animationDescription.type === 'attack') {
      generatedStates = new AttackDescriptionReader()
        .getAnimationStates(
          animationDescription as FileAttackAnimationDescription,
          globalInteractionsMap,
        );
    } else {
      generatedStates = getAnimationStates(
        animationDescription as FileAnimationDescription,
        globalInteractionsMap,
      );
    }
    generatedStates.forEach((generatedState) => {
      animationMap.set(generatedState.id, generatedState);
    });
  });
  return animationMap;
}

/**
 * Reads a character file to create a character.
 */
export default class SimpleCharacterFileReader {
  static readCharacterFile(
    characterData: SimpleCharacterFileData,
  ): CharacterTemplate {
    const globalInteractionsMap = getGlobalInteractionsMap(characterData.interactions);
    const animationGraph = getAnimationGraph(characterData.animations, globalInteractionsMap);
    return new CharacterTemplate(
      characterData.stats.movementSpeed,
      characterData.stats.movementAcceleration,
      characterData.stats.knockbackStrength,
      characterData.stats.maxHealth,
      animationGraph,
      getAnimationStateID(characterData.initialState, 0),
    );
  }
}
