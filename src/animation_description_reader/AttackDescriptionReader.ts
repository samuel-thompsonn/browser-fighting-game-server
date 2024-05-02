import { AnimationState, FileCollisionItem, StateInteractionDescription } from '../CharacterFileInterface';
import CollisionEntity from '../CollisionEntity';
import StateInteraction from '../state_interaction/StateInteraction';
import FileAttackAnimationDescription, { FrameType } from './FileAttackAnimationDescription';

function getAnimationStateID(animationName: string, orderIndex: number) {
  return `${animationName}${orderIndex + 1}`;
}

function loadCollisionEntities(
  collisionData: FileCollisionItem[],
): CollisionEntity[] {
  const collisionEntities: CollisionEntity[] = [];
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

function getTransitionInteraction(
  thisStateID: string,
  destinationState: string,
  frameType: FrameType,
): StateInteraction {
  const interactionDescription = frameType !== 'end' ? ({
    name: 'remain in the current state',
    id: `${thisStateID}-DefaultTo-${destinationState}`,
    priority: 1,
    conditions: [],
    effects: [
      {
        effectType: 'setNextState',
        args: [
          {
            argName: 'destination',
            value: thisStateID,
          },
          {
            argName: 'resolutionType',
            value: 'afterEnd',
          },
        ],
      },
    ],
  }) : ({
    name: 'default to idle left after this animation finishes',
    id: `${thisStateID}-DefaultTo-${destinationState}`,
    priority: 1,
    conditions: [],
    effects: [
      {
        effectType: 'setNextState',
        args: [
          {
            argName: 'destination',
            value: destinationState,
          },
          {
            argName: 'resolutionType',
            value: 'afterEnd',
          },
        ],
      },
    ],
  });
  return new StateInteraction(interactionDescription);
}

function getStateInteractions(
  animationDescription: FileAttackAnimationDescription,
  globalInteractionsMap: Map<string, StateInteractionDescription>,
  frameType: FrameType,
): StateInteraction[] {
  const interactions: StateInteraction[] = [];
  if (animationDescription.state.importedInteractions) {
    const generalImportedInteractions = animationDescription
      .state.importedInteractions.general || [];
    const frameTypeImportedInteractions = animationDescription
      .state.importedInteractions[frameType] || [];
    const importedInteractions = generalImportedInteractions.concat(frameTypeImportedInteractions);
    importedInteractions.forEach((importedInteraction) => {
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
  // if (animationDescription.state.interactions) {
  //   animationDescription.state.interactions.forEach((interactionDescription) => {
  //     interactions.push(new StateInteraction(interactionDescription));
  //   });
  // }
  interactions.push(
    getTransitionInteraction(
      animationDescription.id,
      animationDescription.destinationState,
      frameType,
    ),
  );
  interactions.sort((a, b) => a.getPriority() - b.getPriority());
  return interactions;
}

function getFrameType(
  animationDescription: FileAttackAnimationDescription,
  frameIndex: number,
): 'startup' | 'active' | 'end' {
  const { startup, active, end } = animationDescription.numFrames;
  if (frameIndex >= 0 && frameIndex < startup) {
    return 'startup';
  } if (frameIndex < startup + active) {
    return 'active';
  } if (frameIndex < startup + active + end) {
    return 'end';
  }
  throw new Error(`Invalid frame index: ${frameIndex}`);
}

function getAnimationState(
  animationDescription: FileAttackAnimationDescription,
  frameIndex: number,
  globalInteractionsMap: Map<string, StateInteractionDescription>,
): AnimationState {
  const id = getAnimationStateID(animationDescription.id, frameIndex);
  const frameType = getFrameType(animationDescription, frameIndex);

  let stateCollisions;
  if (animationDescription.state.collisions) {
    const generalCollisions = animationDescription.state.collisions.general || [];
    const frameTypeCollisions = animationDescription.state.collisions[frameType] || [];
    stateCollisions = loadCollisionEntities(generalCollisions.concat(frameTypeCollisions));
  }

  const stateInteractions = getStateInteractions(
    animationDescription,
    globalInteractionsMap,
    frameType,
  );

  const totalFrames = (
    animationDescription.numFrames.startup
    + animationDescription.numFrames.active
    + animationDescription.numFrames.end
  );
  return {
    id,
    frameInfo: {
      frameIndex,
      // numFrames: animationDescription.numFrames[frameType],
      numFrames: totalFrames,
      stateID: animationDescription.id,
    },
    interactions: stateInteractions,
    effects: {},
    collisions: stateCollisions,
  };
}

function getAnimationStates(
  animationDescription: FileAttackAnimationDescription,
  globalInteractionsMap: Map<string, StateInteractionDescription>,
): AnimationState[] {
  const generatedStates: AnimationState[] = [];
  const {
    startup: startupFrames,
    active: activeFrames,
    end: endFrames,
  } = animationDescription.numFrames;
  for (let i = 0; i < startupFrames + activeFrames + endFrames; i += 1) {
    generatedStates.push(getAnimationState(animationDescription, i, globalInteractionsMap));
  }
  return generatedStates;
}

class AttackDescriptionReader {
  getAnimationStates = getAnimationStates;
}

export default AttackDescriptionReader;
