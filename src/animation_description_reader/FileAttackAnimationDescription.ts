import { FileCollisionItem, ImportedInteractionDescription, StateInteractionDescription } from '../CharacterFileInterface';

export type FrameType = 'startup' | 'active' | 'end';

export interface FrameTypeMap<T> {
  general?: T;
  startup?: T;
  active?: T;
  end?: T;
}

interface FileAttackAnimationDescription {
  name: string;
  id: string;
  type: string;
  numFrames: {
    startup: number;
    active: number;
    end: number;
  };
  destinationState: string;
  state: {
    importedInteractions?: FrameTypeMap<ImportedInteractionDescription[]>;
    interactions?: FrameTypeMap<StateInteractionDescription[]>;
    collisions?: FrameTypeMap<FileCollisionItem[]>
  }
}

export default FileAttackAnimationDescription;
