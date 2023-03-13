import MutableInteractionLibrary from './interaction_data_library/MutableInteractionLibrary';

export default class BasicInteractionLibrary implements MutableInteractionLibrary {
  #valueMap: Map<string, string>;

  constructor() {
    this.#valueMap = new Map<string, string>();
  }

  set(argName: string, value: string): void {
    this.#valueMap.set(argName, value);
  }

  getValue(argName: string): string | undefined {
    return this.#valueMap.get(argName);
  }
}
