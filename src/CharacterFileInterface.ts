import CollisionEntity from './CollisionEntity';
import FileAttackAnimationDescription from './animation_description_reader/FileAttackAnimationDescription';
import StateInteraction from './state_interaction/StateInteraction';

export interface CharacterDimensions {
  width: number;
  height: number;
}

export interface CollisionRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitboxRectangle {
  collisionBox: CollisionRectangle;
  damage: number;
  knockback: number;
}

export interface AnimationState {
  id: string;
  frameInfo: {
    frameIndex: number;
    numFrames: number;
    stateID: string;
  }
  interactions?: StateInteraction[];
  effects?: {
    move?: { // x and y movement are proportional to movementSpeed stat
      x: number;
      y: number;
    }
  }
  collisions?: CollisionEntity[];
  // Should also have a hitbox and hurtbox set
}

export interface CollisionProperty {
  propertyName: string;
  valueType?: string;
  propertyValue: string;
}

export interface FileCollisionItem {
  entityType: string;
  properties?: CollisionProperty[];
  rectangles: CollisionRectangle[];
}

export interface ControlsTransition {
  control: string;
  destination: string;
}

export interface TransitionEffectDescription {
  effectType: string;
  argumentLabels: string[];
}

export interface CollisionTransitionDescription {
  foreignEntityType: string;
  selfEntityType: string;
  destination: string;
  effects: TransitionEffectDescription[];
}

export interface InteractionArgumentDescription {
  argName: string;
  value: string;
  valueType?: string;
}

export interface InteractionConditionDescription {
  conditionType: string;
  args: InteractionArgumentDescription[];
}

export interface InteractionEffectDescription {
  effectType: string;
  args: InteractionArgumentDescription[];
}

export interface StateInteractionDescription {
  name: string;
  id?: string;
  priority: number;
  conditions: InteractionConditionDescription[];
  effects: InteractionEffectDescription[];
}

export interface ImportedInteractionDescription {
  id: string;
  priority: number;
}

export interface FileAnimationDescription {
  name: string;
  id: string;
  numFrames: number;
  type?: string;
  state: {
    importedInteractions?: ImportedInteractionDescription[];
    interactions?: StateInteractionDescription[];
    effects?: {
      move?: { // x and y movement are proportional to movementSpeed stat
        x: number;
        y: number;
      }
    }
    collisions?: FileCollisionItem[];
  }
}

export interface SimpleCharacterFileData {
  name: string;
  initialState: string;
  stats: {
    movementSpeed: number; // Units per second
    maxHealth: number;
    knockbackStrength: number;
  },
  interactions: StateInteractionDescription[];
  animations: (FileAnimationDescription | FileAttackAnimationDescription)[];
}
