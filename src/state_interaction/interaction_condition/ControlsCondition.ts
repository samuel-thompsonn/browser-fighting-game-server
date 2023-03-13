import InteractionInfo from '../InteractionInfo';
import InteractionCondition from './InteractionCondition';

export default class ControlsCondition implements InteractionCondition {
  #controlLabel: string;

  constructor(conditionArgs: Map<string, string>) {
    const controlLabel = conditionArgs.get('control');
    if (controlLabel) {
      this.#controlLabel = controlLabel;
    } else {
      throw new Error('Missing argument "control" for interaction condition ControlsCondition.');
    }
  }

  evaluate(conditions: InteractionInfo): boolean {
    return <boolean>conditions.controlsMap.get(this.#controlLabel);
  }
}
