import { StateInteractionDescription } from '../CharacterFileInterface';
import StateInteraction from './StateInteraction';

const description: StateInteractionDescription = {
  conditions: [
    {
      conditionType: 'controls',
      args: [
        {
          argName: 'control',
          value: 'moveLeft',
        },
      ],
    },
  ],
  effects: [
    {
      effectType: 'setNextState',
      args: [
        {
          argName: 'destination',
          value: 'left',
        },
      ],
    },
  ],
  name: 'test interaction',
  priority: 1,
};

const actualInteraction = new StateInteraction(description);

console.log(actualInteraction);
