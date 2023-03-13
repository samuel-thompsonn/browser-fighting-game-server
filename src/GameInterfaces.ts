import CollisionEntity from './CollisionEntity';

interface CollisionMember {
    characterID: string;
    collisionEntity: CollisionEntity;
}

export interface CollisionEvent {
  firstEntity: CollisionMember;
  secondEntity: CollisionMember;
}
