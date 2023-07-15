import { AnimationState } from './CharacterFileInterface';

export interface TransitionInfo {
  default: string;
}

export interface AnimationGraph {
  name: string;
  states: AnimationState[];
}

export interface Position {
  x: number;
  y: number;
}

export enum Direction {
  LEFT = 'left',
  RIGHT = 'right'
}

export interface PlayerInputs {
  right: boolean;
  left: boolean;
  lightAttack: boolean;
  heavyAttack: boolean;
}

export interface ControlsChange {
  control: string;
  status: 'pressed' | 'released';
}
