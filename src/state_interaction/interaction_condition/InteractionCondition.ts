import InteractionInfo from '../InteractionInfo';
import MutableInteractionLibrary from '../interaction_data_library/MutableInteractionLibrary';

interface InteractionCondition {
  /**
   * Evaluates the conditions and resolves whether this particular
   * condition is met.
   * @param conditions All necessary information in order to evaluate
   * any condition.
   * @param library Mutable map from labels to string data. Used to
   * record information gathered from evaluating conditions so that
   * effects can be parameterized.
   */
  evaluate(conditions: InteractionInfo, library: MutableInteractionLibrary): boolean;
}

export default InteractionCondition;
