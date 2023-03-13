- Refactor "afterEnd" and "interrupt" modifiers on transitions to be object oriented
- modify collision knockback effect and transition effect interface to
use a passed list of string args rather than magically knowing the names
properties to query in the collision entity.
  - cooler solution: build the names into the instance of the transition effect,
  since they are not expected to change over time.
- make knockback strength of character affect knockback strength of
attacks
- make a generic factory to avoid code duplication between the existing
factories
  - Probably uses a parameterized class (so something with a < T > going on)
- change interaction condition and interaction effect to not have to
re implement the constructor code for grabbing features from the given
parameter map. Instead make it an abstract class with access to methods
for grabbing info straight from the map. Then make things data driven
somehow? ehh maybe not.
- make it so that interaction effects can have their arguments interpreted
either as literals or as keys into the context (library) that is
handed to them.
- allow interchanging character files by having the character files
get sent in through a POST endpoint
- make a condition that checks a value in the context, the guiding example
being to check the direction and strength of knockback to know what animation
to play