## 5/21/2022
- How do I respond to collisions? When a collision occurs, I want to notify
each affected party so that they have the info necessary to answer the
following questions:
  - What algorithm should I use to determine my response?
    - What type of entity in my dominion was involved in the collision?
    - What type of entity NOT in my dominion was involved in the collision?
    - What is my mapping from entity pairs to algorithms?
  - What parameters should be given to that algorithm?
    - What are all of the pieces of information that I can use? This is in
    a structured environment but seems to rely on nonstructuredness, so
    if I want to do something unstructured then I should use a map from
    strings to strings, and then use string parsing in my collision handlers
- So what does this decision look like in practice?
  - In the main collision loop, I run my basic collision checker. Instead of
  what it currently returns to me, it returns a collision event which contains
  two collision entity objects. Each object has a string 'type' field, and
  a list of properties. What's an example?
    - A character has an event so that, when its hurtbox collides with a hitbox,
    it takes damage and goes into a knockback state. Now we can say what the
    information it needs is:
      - What collision entity of its own was involved? **hurtbox**
      - What foreign collision entity was involved? **hitbox**
        - These first two things mean that we go to the "take damage" route.
      - What is the knockback?
      - What is the damage?

## 5/19/2022
- So I've run into a small conundrum when it comes to deining walking
animation in a character file. It's with controls transitions. When you
are in the idle animation, pressing moveLeft should take you to the first
frame of walking left. When you are in the walking left animation,
pressing left should take you to whatever the next frame is of the
current animation, and otherwise we should cancel and default to idle.
So how do I define this sort of behavior?
  - Idea 1: Make it so that, if the control leads us to a DIFFERENT animation,
  then we go to the first frame of it, and if it leads us to the SAME animation,
  we go to the NEXT frame of it. In what situation would this backfire? One
  where pressing the control should restart the current animation. I don't
  think that is common at all, so I think we are okay.
    - This could also backfire in the case where we have a chain of distinct
    animations that require you to hold the same button. We would need to
    define some sort of special type of control input where we go to the
    next animation if we are still holding down the key while on the LAST
    frame of the current animation. This can be done as a non-default option
    that we can read from the file, right?
- Next problem: Default transitions don't make consistent sense. In the idle
animation, doing nothing should take you to the next idle frame no matter what.
In the left animation, doing nothing should take you to the first idle frame,
rather than the next frame of the current animation.
  - Solution: Same deal as before--if it takes you to your current animation,
  then you should progress, and if it takes you to a different animation,
  you should go to frame 1.
  - Really, there should be an object oriented approach where each transition
  lists the name of a "destination resolver", which is an object that
  determines the mapping. That way we can handle arbitrarily complicated
  destination behavior.

## 3/2/2022
- I'm trying to figure out why there's an extra Visualizer in the top left
corner of the client whenever it is not the first to connect to the
server.
  - To replicate:
  1. Launch fresh server
  2. Run client
  3. Close client
  4. Run second client. Observe that there's an inert visualizer in the
  top left corner.
  - SOLVED: It's just because the map was being initialized with one
  starting dummy visualizer mapped to 0.
- When a client disconnects, their visualizer in other clients' visualizers
is still there.
  - The fix: Send a special message on the socket to a client to indicate
  a character has ceased to exist.

## TODO:
- Functionality:
  - Hitboxes/Hurtboxes
    - How will they be implemented?
      - Every game loop, every two characters will be checked for collision
      in a 2-dimensional loop. 
      - All collisions are symmetrical, and are dependent on the predicted
      next position of a character, which is based on the effect of their
      current state (or the pre-effect of their next state?) 
      - Collision events?
        1. hurtbox 1 to hurtbox 2 -> they move up next to each other and no
          further
        2. hurtbox 1 to hitbox 2 -> char1 reacts to being hit
          - this means a hitbox should also have a specified knockback velocity
          and damage.
        3. hitbox 1 to hurtbox 2 -> char2 reacts to being hit
        4. hitbox 1 to hitbox 2 -> nothing for now. Maybe a 'clash' animation
    - Idea: It's like XML so it's in a JSON file and it consists of a list of
    circles/ellipses/boxes, and together they make up the hitbox.
  - Make sure mutliple clients receive updates about every character upon
  state changes
- Make it possible for an effect to be applied pre- or post- change,
so that movement isn't offset by one frame
- Make it possible to define an animation as a homogeneous group of states
in a characte file, so that I don't have to make 60+ nodes for it by hand.
- Improve design by extracting out functionality and refactoring controls
so that there's a controller interfacing with data gatherers (clientlistener)
and with data consumers (characters)
## Design dilemmas:
- Idea 1:
  - Instantiate a model
  - When a client connects:
    - Create a character
    - add the character to the model
    - assign the client handler to the character
    - problem: what about when that character is destroyed and we want to
    give them another character? The important thing is that there's a
    difference between a CLIENT and a PLAYER. A CLIENT has a persistent
    connection and can tell the game that they'd like to get a new character,
    but only if they don't already have a character.
      - That's an interaction with the game when it's in a "lobby" state,
      and the controls are when the game is in an "in-game" state.
  - So when a client connects:
    - Don't instantiate a character until they ask for one to be instantiated
    with certain specs. Then put it in te model and give it to them.
    - Then give them various interfaces based on game state.

  - Make sure that the rate at which animations update is independent of
the rate at which the game sends updates to clients
  - That doesn't make sense. Messages are sent to the client as soon as an
  update occurs, and updates occur once every game loop which is on a fixed
  timer.
  - The real problem is that the update speed is independent from the
  movement speed. However, running at fewer updates per second should not
  change movement per update.
  - Solution: Make a fixed number of state updates per second, but a non-fixed
  number of game loop runs per second.
    - But what could be the motivation for this? hmm.

- Problem: The client handler absorbs information about controls from the
user, and this information needs to get to the updating function in the
Character class. But the information isn't consumed immediately; instead,
it is placed in a map and referenced when we need to update the gamestate.
So who stores this map?
  - Idea 1: Client stores the map
    - But that sucks because then we have to poll the client or otherwise
    bug them to get the data to our gameModel
  - Idea 2: gameModel stores the map
    - But then gameModel is storing information about each player, instead
    of the player storing information about themselves
  - Idea 3: character stores the map
    - But then a character update won't be a function of its current state
    and inputs, since it will store previous inputs.
    - Solution: A character keeps track of its own controls, then
    throws them away upon an update!
  - Idea 4: There's an object that acts as a controls map. It has two
  interfaces: The part that lets it modify controls (accessible from the
  client listener) and the part that lets you read the controls (accessible
  from the character). When a client disconnects, the controller knows,
  and it clears its controls.

## 3/13/2023

What is there to work on to make the game better?
- Make the character feet be on a reasonable position relative to the stage
- Make the whole game larger on-screen so I don't have to squint at it
- Nicer CSS etc around the whole thing
- Make the background dark
- Make it so that only two players can be in
- Give some kind of loading screen or message for when the server is not reachable
- Health bars with win condition and ability to proceed to next round.
- More attacks, to add some kind of interesting strategic thought
- Simplify character files / character definitions / implementation to ensure things don't get jank
- Allow jumping and ducking, gravity-based movement (maybe without acceleration?)
- Require two players to start the match, ask for players to mark as ready
- Give information to animations such that character position can be slightly changed during them
  - Example: frame 1 has offset of (x, y), or maybe entering frame 1 literally moves the character (x, y)
  - This is to fix the issue where centering the sprite during animation makes things look unnatural

Now I can sort through these to separate between client and server side, and prioritize them.

Front end:
- Fix character position on stage (make coordinates make sense with stage)
- Improve page style
- Dark background
- Health bars
- Scale canvas size to actually use the page
- Fix the strange sprite behavior with left-facing punch
- Put some nice way to toggle debug views like hitbox information

Back end:
- Gravity (fixed fall speed)
- Limit room to X players (configurable)
- Character health
- Win condition
- Simplify character files
- Require X players to start the match
- Allow animations to adjust character position/center
- Don't allow characters out of bounds

Character work:
- Jumping and ducking
- More moves
- Make the hitbox align with the sprite nicely

Priority queue:
1. Dark background
2. Character feet position
3. Health
4. Health bars

## 3/15/2023

Character health is already sent through the pipe, so the front end healthbar works EXCEPT that it draws the healthbars all in the same place, so I think I need to make a healthbar section of the UI that automatically configures the healthbars relative to each other.

## 3/18/2023

I am working on rescaling the characters, and the idea is this--previously I just had world space coordinates, and those were being translated directly to canvas space coordinates. So that means if a character was at position (100, 200) they actually should be drawn at (100, 200) on the canvas--of course, translations/scaling in y coordinate don't matter as long as everything is drawn at the same heigh coordinate, but scaling in x coordinate does matter because then the hitbox visualizations won't be accurate. But now I have the following spaces:

- world space
- pixel space

I'm having trouble thinking about it, so I should do an example. We start out with character Ryu, who is at (-30, 0) and has height and width of 64.

Really, the 'arbitrary canvas units' I'm talking about for defining the canvas should be the arbitrary units of world space, such that I'm defining the canvas to have specific dimensions in world space. That way I can just pass in world space dimensions to the canvas and it will resolve them into pixel space. That also allows me to potentially translate the canvas too, or let it move!

I think in that case it would also be appropriate to make the background not depend on the canvas and instead have a fixed size in terms of the world, and just have the canvas draw the parts that are visible. I think that's a lot cleaner since it makes the background seem like a part of the world.

And honestly, the camera is already translated since its top left is at (0, -84) or so instead of (0, 0). Cool, I can move forward with that.

There is one important distinction, though, that makes it important to differentiate between pixel space and world space. GUI elements such as the healthbar should be defined in terms of proportion of the screen they cover rather than in terms of world space. But also, I'm considering having healthbars show up in some sort of HTML-defined GUI layer that sits on top of the canvas or next to it, so that I can use CSS layouts to define the in-game GUI.

Now I have a camera that is detached in size from the game, and a canvas which allows me to draw elements based upon their in-game size and translate that to canvas (pixel space) size in an abstracted way, which is great!

Next up I want to deal with the strangeness that is the hitboxes compared to the character sprites. And the fact that switching sprites throughout an animation often causes changes in the character's position. Right now I just scale all the animation frames to fit within the same box, which is really no good for the look of the game. And right now hitboxes are defined in terms of a space in which characters are assumed to be exactly 64 game units tall and wide, so that a hitbox with width 1 is 64 game units wide, which makes sense when every animation has the character being the same width but is otherwise pretty silly.

So instead I would rather have the following:

- Hitbox sizes and locations are defined in terms of game units (current system but scaled by 64, arbitrarily)
- The locations for hitboxes are defined in terms of a fixed point; if a character is at x=0, y=0, and the fixed point for the sprite is at (10, 12), then the pixel at (10, 12), or the proportional amount into the sprite, will be in the game world at x=0, y=0. I could go for an example here. Additionally, that fixed point will be where a hitbox with a top right corner at (0, 0) will have its top right corner.

In this case I also would need some number determining the character's actual size in game units, considering that the sprite itself should be able to scale. And that size varies from frame to frame, but it varies exactly in proportion to the number of pixels of the sprite. That need not be the case, but it just feels odd and rife with human error to manually set relative sprite size for each frame.

How can I do things quick? I can definitely assign a base width or height that applies to all characters since I only have one character. And I can claim that width (we'll go with width) corresponds to a the width of the idle animation sprite. This gives me a ratio I can work with to derive the in-game size of each of the other sprites based upon their number of pixels. But in the case where animations have varying sizes, they would still have the same number of pixels, so I would be scaling them to all the same size--but that's actually okay since I just need to set a proper center/fixed point for each sprite.

So with that idea decided, let's do it! The steps are:
1. Choose a base width for Ryu, in accordance with his starting animation.
  **64 width, which is what I originally chose.**
2. Calculate the ratio of pixels to game units in his starting animation.
  **49 pixels wide, so 49/64 is pixels:units**
3. Hard-code this ratio into the visualizer, and use it to draw sprites as if they all have fixed point (0, 0).
  **Needed to also adjust the camera and scale the background to account for increase in character size in-game**
4. Choose fixed points for the attack animation, and hard-code them in somewhere.
  **Starting with just attack left and adding some guesswork fixed point to get started.**
5. Add logic to use these fixed points as an offset for drawing the sprite compared to the actual character location.
  **It actually works quite nicely, and makes the character hitbox align well with the attack!**

Next up: These white lines have been bothering me a whole lot. Why do they happen and what can I do about them? They are specifically showing up in the last two frames of the walking animations, which I believe are represented by 'left' and 'right'. It also shows up in the last frame of the idle animation on both sides.

It seems to be caused by lines on the sprite sheet, which I guess makes sense. Can i tighten the sprite sheet parameters up to account for this? I bet the stride is zero right now.

The sprite width is 49 and the stride is 50, so I think I can get away with thinner sprites with more stride. The actual sprite width is 43, starting at x=6 in the right facing sprite sheet. The second sprite is at x=55, third at 105, and fourth at 154. So with a stride of 49, we have:

x=6, x=55, x=104, x=153. It looks like the stride is irregular, which is unfortunate, but I can correct this with my new offset feature! Except, of course, I don't actually have a way to set the offsets of individual frames in the animation--I need that, and honestly I should probably come up with some kind of abstraction of animation sprite sequences that allows this to be nicely encoded.

Okay so it looks like the stride is irregular on that sprite sheet, so the best move is probably to go in and fix up the stride to make it regular. But for now we at least have gotten rid of the white lines on the right, at the expense of being forced to cut off a pixel.

## 3/22/2023

I spent some time today cleaning up the animations and background to look tidier. Then I got started making a group element for controlling the layout of the healthbars so I can make this into an actual game with winners. That is what I will work on in my next opportunity.

## 3/24/2023

I'm making the healthbar tray so HP can be visualized for multiple characters. Then I should gamify by making attacks do domage to HP and declaring a winner when one character's HP drops to 0.

I've now started a new arhcitecture for the canvas--instead of passing the visualizers into the canvas, App.tsx can just pass a map of JSON character states into the canvas and the canvas can own the visualizers. This still isn't perfectly React, but I like the compromise since it means the visualizer can be very flat and essentially still just portraying data statelessly.

## 3/25/2023

Next thing I would like to do is truly flatten the canvas so that it draws characters as a function of character JSON--this probably involves (1) injecting a single character visualizer interface that draws characters functionally, and (2) drawing those characters functionally based on character data.

I've made CharacterVisulizer an injected class to Canvas, and I've added text to the healthbar and sprite visualizer so that it is possible (if a bit ugly) to identify characters and identify which healthbar describes which character. Next I want to modify the backend (or maybe just character data?) to make the punch deal damage.

I've started by just making a damage effect that does a flat 10 damage, and it works! I only have 1 attacking move, so it's okay to hard code the damage for now. Next up I should make the game react to when a character runs out of health. How should it react?

From the user perspective:
- Losing character plays a knocked-out animation
- Text displays saying which player won
- After a few seconds, another round begins.

From a design perspective--the backend is responsible for communicating to the frontend when the round is won, and for waiting a certain amount of time before ending the game / resetting.

I think in the final version this would destroy the game instance and take us to a lobby or some kind of end screen displaying results/statistics.

Honestly, I don't even need the game to reset. It would probably be better to just have the game terminate entirely when the round is over. That supports the flow where we play through a game and then go back to the lobby. That said, it probably would be nicer to have the option of multiple rounds, where character positions reset between rounds. But that is not a necessary feature for gamification.

## 3/28/2023

The game model will send a signal internally when the game starts, so that I can add a state to Ryu that activates when he wins the game. I can also add a signal for health so that Ryu can enter a dying state based on his health reaching 0.

First, I'll make the signal that gets sent to the client. Then I'll make the internal health signal so that the dying state happens. And the internal signal for the winning state is really not necessary, so I can punt that. The most important thing is making a full loop, so I should probably actually next work on letting the players choose to reset the game after it ends. And I can probably use the same mechanism to let players ready up in the first place. This feature will be replaced when we instead get an intermediate menu for things like character choice.

Now the server can get stuck in a 'won game' state, so I will definitely need to add something allowing a reset, or a vote for a reset. That can be available through the client handler.

Where I left off: I still need to finish the flow for resetting the game so that it doesn't look strange and choppy, but I really do believe that the best move is to completely regenerate the GameModel instance rather than try to clean it up, since that is just the cleanest way to go about it. But that means unwiring all the subscriptions between the old and new GameModel instance (probably by overwriting them).

Another thought: Maybe the client interface shouldn't listen to individual characters, and instead should listen to the GameModel as a whole giving lists of character updates to describe state on a specific frame. That way it would be clear when a character stops existing because you would only need to draw the characters that appeared in the most recent update (unless you want to do fancier logic on the front end involving series of game states).

## 4/8/2023

Proceeding with the thought stated above, since I like the encapsulation it brings.

So the currently flow is as follows: The main class creates a ClientHandler upon connection which implements CharacterListener. It passes this to the game class's method for adding a listener, which individually subscribes the character listener to each character. This is good for tell-don't-ask since the characters can tell subscribers every time something changes in their state, but it goes against encapsulation in a way since it makes for an interaction between something outside the game interface (client handler) and something inside the game interface (character) to directly interact. The reason this is causing a problem for me is that it's annoying to unsubscribe the client from all the characters when dropping a GameModel instance.

Idea 1 is that the sytem would be more like this: Clients subscribe to a GameModel. Every game tick, the game polls all characters for their position and sends a single game state description to each client. This is great, but it involves polling rather than bubbling up events in a tell-oriented architecture. So honestly what would be nicer is if the client subscribes directly to the game model, but the same internal logic is used. Then there can be a simple "unsubscribe" method for the game model that bubbles down into unsubscriptions to all characters, OR the game model could avoid having the characters and clients touch entirely--that part is encapsulated. I also favor the idea of incremental updates to gamestate rather than sending the full gamestate each frame, since there is little redundancy then--with the caveat that it is less functional and more stateful an API.

The reason things weren't resetting properly is because the character listener already had a character ID assigned, and therefore was not calling the signal to create a new character because there is a gating check to see if character ID is already assigned before asking for a new one. So resetting the game should unassign all characters (and maybe there should be a way to leave the lobby? Not sure since that constitutes a forfeit).

After also making a change to ensure that clients forward their controls changes to the right game model, I am now very close to things being good--I just need to somehow send a signal to clear the board on the client side when a reset occurs. 

I also did a little refactor where I replaced passing a GameModel into ClientHandler with passing a function. I realize now that passing in a list of fuctions is basically the same as passing in an interface, but the interface version is more extensible. So really I should make a game interface provided by index.ts (or put another layer between index.ts and ClientHandler) and pass that in as the argument for ClientHandler to use for assigning to socket signals.

Next thing to do: Send a reset signal to the clients upon game reset so they can destroy the existing character visualizers immediately, and generally so they can react to a game reset however they deem appropriate.

## 4/9/2023

I now have a full tehnically playable game loop. Next thing to do is feed the signal for health (or low health) into character state transition so that there is a knockout animation and lying on the ground animation for when the round ends.

Other things on the roadmap: Adding a kicking animation/attack that does more damage and is slower and has a different reach, adding the ability to combo the jab into other things if the first hit lands. Blocking, grabbing. Also making it more into a game instead of a debug test by defining the full game flow from when you first join the website to lobby to match to match finished.

## 4/15/2023

Yesterday I did some work on adding a "knocked out" animation. And now I would like to see if I can expand on that by (1) having a sprite for the hurt/knockback animation, (2) having the hurt/knockback animation corresponding to the direction of knockback happen when you are hit, and (3) add a new attack type, a kick, which is slower and longer range but can be interrupted with a punch.

## 5/7/2023

Maybe something I would like to have is a front-end animation tester that lets me specify an animation state and show the character play it out. Or better yet, a sequence of animation states with frame amounts specified. That would help me rapidly develop new states and might be pretty neat.

The UI would just let you input a list of (state name, frame duration) pairs, and then you can click a 'play/stop' button that plays through the animations you specify. In fact, it even sounds like a bit of a fun visualization to show the entire sprite sheet with an indicator about which sprite we are reading--but that's kind of a spike project.

## 6/19/2023

I want to finish up the kicking sprite, so I guess I should go ahead with putting together some kind of animation player.

## 6/30/2023

Okay, now I am looking at making character modification easier by making the character file simpler. First, I am making a "symmetrical" version of the character file to avoid the duplication of states. Once I get that feature working, I can focus on a feature for creating attacks that allows specifying startup and end lag frames, which allows for higher-level definition of attacks.

It also might be nice to split interactions and/or animations into separate JSON files, which would enhance reusability. But for that I need to invent some form of dynamic file reading, which I only know how to do via S3/HTTP fetching at the moment.

I've also invented the notion of knockback from context, but I haven't implemented it yet. So I could go forward with that.

For direction, I could have direction be an aspect of the character state and have an effect for switching direction. This would force all animations to now have a direction, but I could make an adapter that simply appends direction to the end of animation state name in the front end.

Another idea: If I want to execute a back-air, I would need to have a way to tell whether the key I'm inputting represents back- or front-facing direction. But if the jumping neutral state is symmetrical, then I can't guarantee that left or right is facing back or front. So the solution might be to add "derived controls" signals such as "forward" or "back" that can also be used as controls input even though they can't be directly inputted by the player. forward and back are really the only such controls I can think of, but that understanding could change pretty easily.

## 7/1/20232

What is the formula for deriving the offset + coordinates on the main sprite sheet given the offset + coordinates on the left sprite sheet? Well, the trick is that they are horizontal mirrors of each other. Thus, if the coords are (x, y) on the flipped sprite sheet, then on the unflipped sheet you go the same number of y pixels down, and the same number of x pixels left from the top right corner of the unflipped sheet.

So in that case the formula for flipped -> unflipped is:

```
unflipped_x = sheet_width - flipped_x
```

Super simple! In our Ryu case, the sheet width is 1541, so the formula is just 1541 - x. But there's one more factor! In the flipped sprite sheet, you start from the right of the sprite, so you offset another stride length to the left from your start position, which you do not do in the unflipped sheet. So the final formula is:

```
unflipped_x = sheet_width - stride_length - flipped_x
```

Should I do anything about the fixed point? Yes, definitely. Should I just negate it? No, that doesn't work. So maybe I just cancel it entirely? Curiously, it looks like a fixed point of +5 instead of +24 makes this animation line up nicely with the walking animation. Why?

In the animation, I'm trying to line up Ryu's shadow to stay in one place. The shadow is 5 pixels away from the left edge of the frame, and 24 from the right edge of the frame. Though it looks like I need to move the frame 1 pixel over to account for the outer edge, so now it's +4 and +24. The shadow is 4 pixels from the border on the left, and 24 pixels from the border on the right. So if I want to make these animations flippable, I need to position each so that its shadow is equivalent distance from each side of the frame.

Next I'll work on implementing this flipping logic, which should also involve fixing up the sprites so that their shadows' distances from the frames are symmetrical.

## 7/2/2023

So now I'm coming up with the inverse, a formula for finding the image on the flipped sheet.

```flipped_x = sheet_width + stride_length - unflipped_x```

## 7/3/2023

I've finally figured out how to make the sprites behave nicely on the front end symmetrically, so that's great. Now I am working on making the hitboxes also flip about the center axis in response to character direction.

I still need to fix this issue with rendering a mirrored version of the hitbox to match the flipping of the character sprite.

## 7/4/2023

I don't think it was the right move to adjust hitbox mirroring on the front end when I could put it on the back end, so I'll move it there.

## 7/13/2023

It would be nice to have a toggle to turn off hitboxes, since that would help me check whether the hitboxes visually make sense.

### 7/15/2023

Finished the logic for mirroring the collisions, which means that we now have symmetry fully implemented in both hitboxes and animations. What can I do next?

- DONE: Make animation tester work with symmetrical sprite sheet
- DONE: Fix up the animation for getting knocked back
- DONE: Make knockback from attacks take you in the correct direction / put you in the right knockback state
- DONE: Fix up the animation for getting knocked out
- DONE: Fix up the hitbox for heavy attack
- Simplify file definitions of attack animations to include startup & end lag
- DONE: Fix up the hurtbox for Ryu
- DONE: Fix up knocked back animation to separate out the sprites more

Currently I am focusing on fixing up knockback, but right now the issue is that knockback gets reversed on every hit. Why is this happening? The debugger is being kind of uncooperative.

## 7/16/2023

Still working on tracing back the reversing of knockback. It looks like we are reversing knockback in every frame of collision. I am confused with how this reversing of knockback is persisting, though, since I don't store character collisions afterward.

Actually, I think it's because I'm modifying the same knockback effect object when I'm transforming the collision entity. So I just need to make a deeper copy of the knockback effect map. Does that make sense? Basically it's a shallow vs deep copy problem.

Specifically it's because I'm modifying the MAP of transition effects. So what I need to do is make the copyBuilder method use a CLONE of the properties map instead of having it use the properties map itself.

## 7/22/2023

Going ahead with the fix identified in the notes from 7/16. Looks like that was the fix, and now we are good to go with knockback direction--excellent! I imagine this will need another look in the future for generalizing signals that determine transitions.

Next up on my TODO list was:

- Simplify file definitions of attack animations to include startup & end lag

but I would like to actually add another state that might make the game more interesting--either a "low stance" state or a "blocking" state. I think the low state might be more interesting from a gameplay
perspective because it could allow you to duck underneath a high kick.

## 7/29/2023

Let's consolidate the front-end into a user flow mock, then identify what components are necessary to build either locally or in the cloud to make them work. Right now I have the game screen but I'm missing the title screen, lobby selector, lobby creator, and lobby screen. So I will add some skeletons/mock-ups for each of those and link them together.

I've started writing up some nicer design docs. I figure that for the lobby I would ideally use a separate API based on websocket, since I want character selections and readiness updates to be broadcast live. And there's no particular reason that should live on the same host as the game server, so a logical separation would be purely beneficial. But that leads me to want to do another feasibility study for a simple websocket API on AWS, so I will do exactly that. I don't know whether the readiness state should be persisted on DDB, but I feel like there's no reason to do so.

I found this [Amazon help page](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html) describing WS API gateways, and I remembered a big issue I was facing--that there is not really much I can do about storing lobby info in RAM since the gateway is serverless. I think that still might be okay though, since there is nothing pressing about these updates being real-time. The help page links to [this example code](https://serverlessrepo.aws.amazon.com/applications/arn:aws:serverlessrepo:us-east-1:729047367331:applications~simple-websockets-chat-app) which I can inspect and deploy to see if it mirrors my use-case. It's a chat app.

Looking at [this summary](https://aws.amazon.com/blogs/compute/announcing-websocket-apis-in-amazon-api-gateway/) which I've certainly seen before, it looks like this app uses a DDB backend to persist client identifiers. This is an interesting approach--are the messages themselves just stored in client memory then? I'll go ahead and try it now.

It looks like the tutorial uses wscat in the terminal as the frontend, so it doesn't show me how to integrate the app with the web API, but it does show a nice way to broadcast messages and interface with a backend by WS connections, so I'll give that a try and adapt it to my use case! I will want to create and understand my own serverless template for this, and that will be a separate repo.

It's an AWS tutorial, so of course things are not quite working. It looks like the deployment for OnConnectFunction failed because it uses the nodejs12.x runtime when it needs to use at least the nodejs18.x runtime. Is this something I can fix by modifying the SAM script? It looks like I can, so I made a new VSC worksapce for holding this file since I will need a CDK repo for this part of the application. Let's see if bumping the Node version fixes the Lambda deployment--looks like it did! Now I can go back to messing with the API gateway.

Notable that my stack will need to include Lambdas and Lambda roles for each WS interaction type. I also need to figure out how to include the API gateway and role assignment process in the CDK so that I don't have to do this manually. Is there not already an API gateway associated with this deployment? Yes, so I can delete the one I was making myself and go straight to testing.

## 8/26/2023

I want to continue with the lobby selection. What was I doing last time? It looks like I was following a tutorial to make a websocket API--why was I doing that?

It looks like the reason was because lobby interactions should be pushed asynchronously to the client. I can probably control the lobby interactions by a DDB table to make things serverless, since a 100ms response time is perfectly acceptable. So I suppose we should design that. But first, I guess we should design the higher-level system that involves the lobby API as a part. I also can mock up some example API JSON contents for grabbing a lobby.

With the time I have, I think it would be fun to try building a simple version of this API in CloudFormation so that I can get some experience in it. I can do this in a separate package. My objective here is to make an API gateway with two endpoints: createLobby and listLobbies. They will access a DDB in the backend. I think that I will need to manually provide the code for the Lambdas that connect the API gateway to the DDB, though.

CloudFormation keeps nice public-facing docs such as https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigatewayv2-api.html so that I know what fields are available when defining a resource in the template. I'm surprised that no properties are listed as "required"!

Note to self: When stuck on issues related to SSO and you're trying to run a boto3 script, use `aws configure sso`. Also note to self: I left off here: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-cli-creating-stack.html. I was trying to automate the process of uploading+testing a CloudFormation template so that I can rapidly test the ones that I create for the lobby management API.

## 8/28/2023

Continuing on using CloudFormation to create an API Gateway that connects to a Lambda which connects to a DynamoDB.

Using AWS SAM tutorials, I've successfully created a CloudFormation stack consisting of an API Gateway writing to a DDB table through AWS Lambda. This should allow me to build out a lobby management system by plugging the API endpoints into the SPA React app. Cool! (Sam is cool & talented congrats peeps)

Note to peep: You are a great programmer :)
Thanks Annie!

## 8/29/2023

Continuing on the lobby management API by adapting the template. I need the following to continue:

- Proper data model for the lobbies themselves in [lobby management design doc](design/lobby_management_api.md)
- Mocked up lobby selection experience that uses all the relevant data fields from the DB model (including identifier).

## 9/1/2023

Adding some styling to the table on the lobby selection page. I'm following a couple guides for table styling:

- general table styling: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Styling_tables
- table borders: https://www.w3schools.com/html/html_table_borders.asp

Now that some styling has been completed, I will make stub a JS client for interfacing with my API, then rewrite the existing lobby management API endpoint to serve the expected output.

## 9/2/2023

What is the cleanest way for me to connect the frontend and backend deployments without coupling them? I guess it would be to attach a static domain name to my API--how do I do that? I feel like I could also add an AWS AppConfig listing the endpoint and have the deployment set a value there, but that somehow seems like it's not the recommended approach based on quick searches.

I found a Stack Overflow thread saying that I can use my domain name certificate for my API gateway. Let's try it. Link: https://stackoverflow.com/questions/69043426/how-to-configure-a-custom-domain-for-httpapi-using-aws-sam

I found a guide here for using a custom domain name, and I'm adapting it. https://whatibroke.com/2022/01/25/adding-a-custom-domain-name-aws-sam/

It looks like I don't have permission to use subdomains for my domain name, which sucks and I should probably try grabbing another domain name that allows this. But for now I'll just use the 2nd-level domain.

That first guide seems to have resulted in hanging forever. I'll try one more guide for now: https://rhuaridh.co.uk/blog/aws-sam-custom-domain.html. This tutorial made me realize that I''m using the wrong ZoneId.

I used the following guides to successfully create a mapping in the CloudFormation template so that my API will always be accessible through my custom domain:

- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-api-domainconfiguration.html
- https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-api-route53configuration.html

So now the frontend can use a static domain to access the backend, without it changing on every deployment. Nice! I still figure the domain should be through AppConfig or something though, since the business logic doesn't care about the exact URL.

Now let's connect the frontend!

Also, a note: I should probably go ahead and make the websocket-based in-lobby API as a proof of concept before I finish filling out the lobby management API, so that I have a happy-path end-to-end flow.

## 9/4/2023

Continuing on the lobby API by developing a 'create' endpoint. Once I have that working end-to-end, I can move on to developing the proof-of-concept websocket API for in-lobby actions.

I found this source which has allowed me to hook up a Lambda to a websocket API gateway powered by an AWS SAM template: https://github.com/aws-samples/simple-websockets-chat-app/blob/master/onconnect/app.js

Annie also found this font used by Mozilla which looks nice and I might want to steal it: https://github.com/dw5/Metropolis

My next step is to add a disconnect handler to the stack for the Websocket stack, and then to hook it up to CRUD operations on DDB, and lastly to process update messages, especially with JSON data since I'm not sure whether WSS has implicit JSON handling.

## 9/5/2023

Continuing with the Lobby Action API. I discovered how `!Join` works in CloudFormation. It works similar to string join in Python. Example:

```
!Join
  - /
  - - integrations
    - !Ref OnConnectIntegration
```

Output: `integrations/{OnConnectIntegration}`. Previously I thought it would just append together the two arguments but for some reason needed a strange nesting structure for multiple arguments because of how YAML works.

Now I'm a bit confused by Lambda refusing to send a JSON body response for a websocket API. Maybe I can find an example of a working websocket API with JSON data and see if that is normal--it works fine for HTTP requests.

## 9/7/2023

Found this useful code example for using a websocket handler in boto3: https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/python/cross_service/apigateway_websocket_chat/lambda_chat.py

## 9/8/2023

It turns out that print statements are actually sufficient to get good logs on a Lambda in Python 3.10, but there's just a delay between invoking the function and the log entry appearing. I found the following permissions error:

```
[ERROR] ClientError: An error occurred (AccessDeniedException) when calling the PostToConnection operation: User: arn:aws:sts::207922868512:assumed-role/browser-fighting-game-lob-OnUpdateStatusFunctionRo-HHFJUIVVP9JB/browser-fighting-game-lobby-OnUpdateStatusFunction-NXgIoWnSxpcG is not authorized to perform: execute-api:ManageConnections on resource: arn:aws:execute-api:us-east-1:********8512:uuhovneo02/Prod/POST/@connections/{connectionId}
Traceback (most recent call last):
  File "/var/task/app.py", line 42, in lambda_handler
    client.post_to_connection(
  File "/var/runtime/botocore/client.py", line 530, in _api_call
    return self._make_api_call(operation_name, kwargs)
  File "/var/runtime/botocore/client.py", line 960, in _make_api_call
    raise error_class(parsed_response, operation_name)
```

So it looks like I need to add a policy to my Lambda to execute "execute-api:ManageConnections" on the WebSocket API. How do I do this? The [repo with the WebSocket Lambda example](https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/python/cross_service/apigateway_websocket_chat/lambda_chat.py) might be able to tell us how with its [YAML template](https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/python/cross_service/apigateway_websocket_chat/setup.yaml).

It looks like the answer is in [this example repo](https://github.com/aws-samples/simple-websockets-chat-app/blob/master/template.yaml#L171) which I believe to be from AWS directly. And sure enough, that worked. Excellent!

## 9/9/2023

I am integrating the frontend with the lobby action API, and I'm trying to figure out a way for the frontend to sync up with the current lobby status when they first join. One idea is that we can put the current lobby status in the HTTP response to the connection request, but I don't know if I have access to the body of the connection response from the frontend.

What I've developed so far is great, but it's made it clear that I need a couple more tools. First, the client cannot tell which connection / player ID represents them. Second, there's no disconnect-reconnect handling, which could be solved by assigning an ID to each connection on the server side and then storing it client side. Third, there's no mechanism for grabbing the statuses for the players already in the lobby when you join. The second problem is one I can deal with later, but the first and third are important. We also have an issue where there's no way for the client to specify what lobby they're a part of, which defeats the purpose of the lobby separation in the first place. Another issue is that improper sequencing in player status could cause the client and server to disagree on the latest status for players, but I will look into that if it's a problem (I can probably solve it with a timestamp on update messages). I can also look at a solution to this after (1) and (3).

I think there should be two additoinal "endpoints" available to the clients:

1. get_player_id: returns an ID such that any status update with the ID is referring to the caller. This is used by the client as soon as the connection is established.
2. get_all_statuses: returns a list of the statuses of all players in the specified lobby. This is used by the client as soon as the cononection is established.

Once the client connects, they grab their own ID and all the up-to-date player states, and they use it to populate the UI.

How do I solve the issue with lobby separation? The player will know what lobby they're connecting to, so they should send that lobby ID to the lobby action API as part of the handshake. It can be included in the connection table and used as some kind of partition key to determine who should receive status updates.

## 9/14/2023

I looked into authentication for my app since I think it would be good to have users, especially since that would let me gate access to EC2 instances assigned for active games to only those players who are assigned to the game.

It might be possible to comfortably host multiple games on one EC2 instance; but I think this is an optimization and it goes against principles of horizontal scaling.

## 9/19/2023

I have messed around with authentication through AWS Cognito, and it looks like we now have a process for authentication with one frontend app and multiple backends. The frontend uses Amplify UI and Amplify CLI to host a Cognito user pool for the app. It uses Amplify UI components or functions to authenticate with username and password and globally store a Java Web Token. Then, in any API call, the client can stick the JWT in the header or the content, where the server (websocket or HTTP) can read it. The server then uses the 'aws-jwt-verify' package to check the JWT against the same Cognito user pool. If the authentication is valid, response from Cognito contains the user's username, which is a unique identifier for them, so we now have authenticity for a specific identity established between server and client.

This can be used across various systems, and is mainly useful for lobbies and games. In the lobby action API, authentication can be used as the key for a connection in the connections table, ensuring that a player can only be part of a single lobby and allowing other players to identify them by username (or by a display name that is associated with the username in a separate table).

Game instances can keep track of their associated lobby in a DDB table, and can use that lobby ID to check against an HTTP API associated with the lobbies table and see which players should be admitted--all other players may only join as spectators.

So now I should come up with the complicated process for game creation. Here's my take. There exist a FIXED number of EC2 instances for hosting games. Each has an entry in a table of instances for games.

## 11/7/2023

I've decided that Tuesday night is the time for working on browser fighting game. I'll try to hold to that.

I want to authorize users from the client. For that, it looks like I can use AWS Amplify and attach some backend Cloud resources to the client. So I will set that up in order to try hacking something together. Then I need to set the connected microservices (such as the lobby action API and the game server) to reference the identity pool belonging to the stack. The first thing I should do is start up / set up Amplify on the frontend code. That has me following the README for browser-fighting-game client. Do I already have an Amplify stack set up? It looks like I most recently have it "locally"--does that allow some authentication? I can check by running the frontend with a component requiring Auth.

To run the server, I just use `npm start`. Let's just go ahead and add a component requiring authentication to the lobby browser--you at least should not be able to join a lobby without logging in, and I don't mind forcing you to log in early. It looks like I need to install Amplify UI--the [doc](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/#build-an-authentication-experience-using-the-authenticator) says to use:

```
npm install aws-amplify @aws-amplify/ui-react
```

Now it works. As in the previous instance, the login component renders in the place of the component it's wrapping, and it has no styling. I think there's a way to include styling but I'm not worried about that at the moment-my main objective is to leverage client authentication to prove one's identity to microservices, with the following features in mind:

- In the lobby screen, identify players in the lobby by their display name
- When attempting to join a game server, the server should reject players that
  can't verify they are one of the players in the corresponding lobby.

The first change lies in the lobby action API, so I should go there next for auth proof of concept. For now, Amplify gave me a console message saying I should run `amplify push`--so lets' try that and authenticate again.

I remember I did a little bit of research about using an SDK to provide the same AWS infrastructure across multiple packages. Maybe I should start up that research again to prevent having to make code changes when identity pool IDs change.

I'm still getting the same error. What is the problem? The [documentation](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/#set-up-and-configure-amplify-auth) says I need to add the following to my app's entry point (App.js, index.js, main.js, etc.):

```
import { Amplify, Auth } from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);
```

So I'll add that to index.tsx and see if it works. I wonder if I can make authentication optional, like checking to see if I am already authenticated and rendering the non-auth component if I'm not. I bet that's possible, since I can access Auth state without having to wrap a component in Auth. Not sure if that's an anti-pattern though, to access auth using some global function instead of central passed state/props.

Looks like that was the problem--good to know! So now let's try to make a little navigation widget thing at the top that identifies the user, and we can handle logins that way. If at all possible, I want the demo to not require creating an account--but I'll focus on mechanisms for that later.

So the next thing to try is bringing up my websocket API for lobby management and seeing if I can get usernames showing. The biggest obstacle I see is that you can't send data you first connect, so I think we'll need to immediately send a handshake message that has the authentication token. For good measure we should include the auth token in every request.

On a side note, I think it's horrible to have websocket endpoints on the lobby action API that are basically REST endpoints--let's just set up a REST API for this!

But for now, let's just boot up the lobby action API. It runs just fine and interfaces with the frontend--now I need to connect it to Cognito auth, which I believe requires augmenting the IAM roles to add Cognito permissions. Then, following my JWT verification example, I can download some JWT verifier for AWS use.

So it looks like I should modify the policies attached to OnUpdateStatusFunction in template.yaml in browser-fighting-game-lobby-action to allow accessing the Cognito user pool, and I can plug in the ID directly. I found a library online [here](https://pypi.org/project/cognitojwt/) that should let me verify Cognito JWTs through Python. Putting those together, I should be able to verify and make use of usernames in the lobby menu, which is great! I'm done for this week, so now I should tear down any infrastructure. I'll keep the identity pool running since less than 50k monthly active users is free. I'm also tempted to invest in RDE so that I don't have to go straight to the cloud to test the functions--that's another thing to investigate next week.

So here's what to do next week:
- make browser-fighting-game-lobby-action UpdateStatus verify JWT and grab username.
- set up RDE to test this API locally
- start on game server allocation API

## 11/24/2023

Let's go ahead and start on the game server allocation API, since authentication can wait. With which systems does it interface and how?

Here's the behavior description: 
- The game server tells the API that it is available as soon as it is booted up
- When all users in a lobby ready up, the backend (lobby action API) calls the server allocation API to request an available server
- The server allocation API returns an address that clients can use to connect to the server, as well as an identifier for the server
- The clients connect to the allocated game server directly and complete the game. After the server detects that the game is complete, it tells the server allocation API that the game is complete, and frees itself up for further allocation. The clients reconnect to the lobby, and the lobby must contact the API again to grab a server for the next game.

So the biggest feasibility hurdle is this: Does an EC2 instance know the address that should be used to connect to it? I found a Stack Overflow thread [here](https://stackoverflow.com/questions/38679346/get-public-ip-address-on-current-ec2-instance) suggesting that I can, so let's give it a try.

So it looks like an EC2 instance can use the following in the command line to check their own ip address:

```
curl 169.254.169.254/latest/meta-data/public-ipv4
```

They can pipe that into a file or use a Python fetch to get it in RAM for a program. Then they can pass that to the instance management service. So here's what a `POST /instance` request would look like for the game instance interface:

```
{
  "ip": "<my public ip address>"
  "id": "<id I just made up, or instance id>"
}
```

For security reasons, these instances should also be granted IAM roles that give them exclusive access to the game instance interface, and from there we can trust them.

The lobby API asks for instance IP in response to seeing that all the players are ready. In the corresponding Lambda, when it gets the IP, it should push t through the websocket to all clients so that they can proceed to interface directly with the server.

So there are going to be 2 different API gateways that share the same underlying DDB instance.

- API 1: Game instance API. Exposed to EC2 instances
  - `POST /instance`
    - request:
      - ip: IP of the instance
      - id: instance ID of the instance
    - response: 200 on success
  - `DELETE /instance`
    - request:
      - id: instance ID of the instance going offline
        - NOTE: can we also have a mechanism for taking the instance offline automatically?
    - response: 200 on success
- API 2: Instance allocation API
  - `POST /gameStart`: asks for a game server
    - request:
      - lobbyId: ID of the lobby involved--later this can be used to look up the players involved
    - response:
      - instanceIp: Public IP address of the instance to be used for the game
      - 5xx: no instance available, please hold
  - `POST /gameEnd`: frees up an instance 
    - request:
      - lobbyId: ID of the lobby involved
    - response:
      - 200 on success

## 1/1/2024

- 2:26 pm - 2:45 pm (21 minutes)
- 2:56 pm - 4:45 pm (1h49m)

total: 2h10m

Objective: Create the game instance API so that game servers can be nicely lined up with lobbies, allowing the full user experience to take place.

There are actually 2 APIs, but I think they share a database in common. The commonly shared table is the one listing out all available instances by ID with their IPs. How should I arrange them? Should I share a single CloudFormation stack? It looks like I've already made a repo for the instance management and instance allocation APIs under a shared CloudFormation stack.

I think, ideally, I would give each their own CloudFormation stack and make a third one acting as an API layer for the database, so that the database can stand on its own. But that's almost the same thing as making a stack for just the database, just with a single schema locked down. So I'm willing to prioritize velocity with a single stack. Now I just need to remember how to deploy it.

Let's take some time to try locally invoking a Lambda. It looks like I'll need to install Docker. From there I was able to run `sam local invoke --event events/gameStartEvents.json GameStart`, but it fails to access the DDB server, which I suppose doesn't get deployed.

I've now successfully deployed the CloudFormation stack with one API endpoint that allocates a lobby. I tested it in a very manual fashion and it seemed to succesfully query and upate the table when we have one entry, so we should be able to use this to allocate an instance if I just make the API endpoint that lets an EC2 instance offer its own IP. That will be my next objective, and after that I'll set up the lobby and client to make use of this API to get an instance IP for the fighting game. Great!

## 1/28/2024

- 9:07 pm - 9:29 pm = 22 minutes
- 9:46 pm - 11:45 pm = 119 minutes
- total: 141 minutes

Larger Objective: Create the game instance API so that game servers can be nicely lined up with lobbies, allowing the full user journey to take place.

Objective 1: Create a reusable test for the API endpoint I just added, which is the one to fetch an instance IP.

Sub-objective 1: Set up testing infrastructure.

It looks like AWS is recommending I use `pytest`. So I've installed all necessary packages using `pip` on `requirements.txt` and I'll use `pytest` in the command line to give it a try--they have both integ tests and unit tests. For the integration tests, I need to set an env var called AWS_SAM_STACK_NAME to the name of the stack--where do I get the name of the stack?

I found [this guide](https://aws.amazon.com/blogs/devops/unit-testing-aws-lambda-with-python-and-mock-aws-services/) for mocking AWS resources for unit testing in Python. Great!

Using some guides, I managed to get the unit test running using mocks for AWS funcitons with `moto`. I learned a new skill today! Next, let's learn how to set up integration testing.

I've now set up an integ test example in the instance management repo--it actually seems to have helped me fix my Lambda by loading the JSON body from a string submitted by the request. Now that I have a template for testing, I can use test-driven development to guide the remaining endpoints on Tuesday or so. Excellent!

## 2/3/2024

- 12:30 pm - 12:43 pm
- 4:16 pm - 6:25 pm
- 10:12 pm - 10:22 pm

Now that we have unit and integ tests set up for API development, let's set up everything we need to have something functional. For the sake of agility, let's refrain from setting up anything for the server side of the API--instead I will boot up a fighting game server on EC2 running the websocket endpoint, test that it can host, and manually stick its IP in the DDB table. But before that, I'll want to set up the API integration between the client and the API for fetching the IP. I recall that the lobby management API is the one that calls the instance management API, right? I should have a reusable diagram for this given that I had this lapse in memory.

I can put it together with https://app.diagrams.net. I should mainly be talking about the services involved and the interactions between them--I can probably save the finer details like databases for a later version.

![alt text](design/diagram/browser-fighting-game-architecture.jpg)

This is a quick sketch which I believe to line up with the original vision. What can we determine here about how clients will connect to the game server?

We need the following to happen:
1. All users in the lobby ready up.
2. A system recognizes this fact and provides the option for the lobby owner to start the game.
3. A system uses the Instance Management API to allocate itself an instance, acquring a URL or IP.
4. The system pushes the URL/IP to all members of the lobby and tells them to navigate to the page for playing the game with that URL.
5. Clients navigate to the game page with the game server.

So I need to assign the responsibilities for these steps to specific systems. I also think I should split out a lobby action API from the lobby action websocket API so that things that should be HTTP request/response structures can be handled that way.

Since step 4 involves pushing information, it should probably belong the the lobby action API. The lobby action API also owns the table saying who is readied up in what lobby, but the client is able to derive that same information and we'll need to verify that they're correct anyway.

So, that means the following will happen:

1. User tells Lobby Action WSAPI to start the game.
2. Lobby Action WSAPI uses its DDB to determine whether all players in the lobby are readied up.
3. Assuming all users in the lobby are ready, Lobby Action WSAPI (LAWS) grabs a game server from the Instance Management API.
4. LAWS pushes the game server address to the clients and tells them to start playing.

![alt text](design/diagram/browser-fighting-game-architecture-2.jpg)

Awesome! In that case, what should I do next? I can enumerate all remaining tasks at a high level.

Version 0:
- Make sure game instance on EC2 works in some form.
- Add 'start game' channel to LAAPI, which checks readiness and pushes a fixed instance address to all clients. This is the minimum that will allow us to experience the full user flow.

Version 0.1:

- Finish up startGame endpoint on Instance Management API (IMAPI) and add a fixed instance ID to the table.

Version 0.2: 

- Create instance allocation API and set up the game server to use it.


That sounds like a good game plan. But at the moment we don't have a way to reset the game server. We want to make sure that a temporary disconnect does not necessarily end the game, but that the server doesn't reset unless everyone is done. We can work back from what we want the user perspective to look like with that:
- User is navigated to the game server page. The canvas is a loading screen.
- Once all users are connected, the game does a count down and starts.
- The gameplay happens. One player wins the game, and the game server sends this info to clients and it displays as a win/lose screen.
- Clients can click a button to go back to the lobby.

We are actually safe for the server to reset without waiting for clients to leave--it just needs to process any animations that happen after the end of the game and then terminate the connection. Then the clients can handle everything from there--ideally they stay connected to the LAWS even during the game so that the lobby knows if they quit. Awesome, that is very simple! So what changes need to happen?

- A system needs to tell the server who to expect (or at least how many people)
- The server needs to put up a loading screen until everyone is connected.
- The server needs to disconnect from clients and reset the game once it is done sending meaningful information. Ideally, it should be resistant to attempts to reconnect that might reset the game.

Then let's do this! Where should we start? I'd say we should start with the LAWS and then move on to the game server. I'll first check how clients connect to the game server and make sure that connecting to the game server given an address is possible. Then I'll make the LAWS 'start game' endpoint cause clients to go there from a lobby. Lastly, I'll make the game server go through the necessary lifecycle steps.

In that case, I guess we can try setting up some tests for the lobby action API. I already know that the functions work, so the tests shouldn't require me to make any basic changes.

## 2/4/2024

- 5:12 pm - 706 pm (114 minutes)

I am putting together the LAWS endpoint for hitting 'start game' as a client. I found a [page](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy-globals.html) with an example of how to stick environmental variables into a SAM template, and I figure that's what I can do with the EC2 instance IP.

I've added the endpoint. But I realize that in an ultra-minimal example we don't really need the new API endpoint deployed--I can just stub it on the client code to return the target EC2 instance IP. That will let me mock things up nicely. So for now I will stub the websocket endpoint and just test out the transition between accessing the game server and accessing the lobby.

I've modified the code for the frontend to allow navigation back and forth between the game and the lobby, at the expense of deferring lobby naming to an API call (which is honestly a good trade). Next, I should make the game server cut off connections to clients and reset the game state when someone wins and the death animation plays out. Then I can put the game server and client in the cloud and test out the full flow with the lobby APIs offline. Excellent!

From there I can extend to allow multiple lobbies in parallel that share the server infrastructure, starting with the steps outlined from my notes yesterday.

## 2/7/2024

10:17 pm - 11:49 pm
12:00 am - 1 am

As outlined in the previous day's notes, I should modify the game server to cut off connections to clients and reset the game state when someone wins and the death animation plays out. Then I can host the game server on EC2 again and go through the simplest version of the gameplay cycle from the client side.

First, I'll test the server locally to verify that it works. Then I'll add the logic for ending the game.

I think the server should know how many players are in the game to start out, so I should modify the check for winning to use that as a parameter.

I realize that it would also be simple (and good) for me to make the server captable of running multiple game instances at the same time. I would just have to make a GameInstance object and loop through each of them on the update timer to drive them all. But I'll be able to test that once I have multiple lobbies. I almost have everything encapsulated with GameModel.

I wanted to also put in the logic for starting the game loop only once all players have joined. I realize that it probably wouldn't be good to actually base it on the number of d sockets--I should instead only start the game once the required players have joined the game (hitting the Join button in the UI). Then, in the real deal, I can make the clients send that signal to the server without need for player input. So how should I arrange things in that case? Well, ideally we don't want the game instance to exist until both players have sent the JOIN signal, which means that I should handle this in the code owning the GameModel (which is just in charge of simulating game activities). That means putting JOIN signal handling in index.ts, by modifying the handler for the "Create character" signal.

But I disagree with the above approach. First, the "Create character" signal handler can't handle this because it needs to check if all characters have IDs before the most recently created character ID is assigned. But more importantly, I can easily just have the game model handle things like whether it should simulate the game while players are connecting.

## 2/10/2024

3:05 pm - 6:15 pm
10:47 pm - 1:31 pm

Where do I pick up? I think last time I was thinking that there should be an additional layer of abstraction for connection logic that is not specific to the game itself. It can handle things like blocking for the players to join.

What should I work on today? Well, what do I need to show off the end-to-end user flow minimally in production? For that, I don't need to make any changes to the server. Here's some changes on the game server logic that I would like but that I'm punting:

- Add countdown before starting once everyone has connected
- Add entry animation for characters
- Use expected number of players to determine starting positions
- Add end screen/prompt to user once game is complete
- Refactor server code to separate game start/end administration from game simulation
- Extend server code to allow multiple games

But what will I actually work on today?

- Host game server on EC2
- Host client server on the cloud
- Go through minimal flow for main menu -> lobby selector -> lobby -> game -> lobby -> game -> ...

After that, I can work on integrating the lobby action UI to all components so that player status exists in the lobby.

So how do I serve the client? I remember I had a whole process for it that involved serving it on my custom domain. Where are those steps? I can't seem to find them. As a backup, I found some [AWS Amplify docs](https://docs.aws.amazon.com/amplify/latest/userguide/getting-started.html) that explain how to set up auato deployments for a frontend with BFF, which is probably what I'll need if I want to enable authentication.

Also, I've apparently been spending around $5-10 per month hosting an EC2 instance with a public ipv4 address for a while. I should shut that down when I'm done today.

I found an "export.bat" file in the client codebase that just syncs the "build" directory to a directory called "react-cors-spa-w3dltp1i4a", which happens to still exist. Am I currently hosting the SPA? And what would I need to do for that? And does the fact that I now use React Router mean that I can't do that anymore? We'll see.

For now, I guess I should use the [Website Hosting guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html) in conjunction with with the guide for [Configuring static website hosting with a custom domain](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html).

Following the above guides led me to choose between making my bucket publicly available and [using a CloudFront distribution](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/getting-started-cloudfront-overview.html#getting-started-cloudfront-distribution). Since my long-term solution is probably with Amplify anyway, I think I'll go with the public bucket option. So in that case we should be able to access the site on
```
http://react-cors-spa-w3dltp1i4a.s3-website-us-east-1.amazonaws.com
```

I already forsee a problem arising since this doesn't have HTTPS enabled. Let's just skip straight to trying it with Amplify to see if that's simpler. I'll follow [this guide](https://docs.aws.amazon.com/amplify/latest/userguide/getting-started.html?platform=react). Apparently I already have an app set up called `bfgclient`. I also have something called "cognitoauth"--I'll take that down for now.

I need to add a service role in IAM for Amplify following the guide called [Adding a service role](https://docs.aws.amazon.com/amplify/latest/userguide/how-to-service-role-amplify-console.html). It's not clear to me if I'll need to change the build settings, so I'll keep them as they are for now.

I wonder if I can use Amplify to manage hosting for my entire app while still having APIs managed by different repositories. It certainly seemed like there was space for multiple repos, so I wonder how they work together. That would make things pretty convenient because I would have one place to go for deployment and I could just focus on the code.

Sure enough, the deployment works! That is very convenient. But I can't connect to the server because of CORS errors, which must be because I'm not using the expected domain. So now I'll follow the guide to link up to a custom domain [here](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html).

It looks like my environmental variables for CORS are configured to be specific to an old cloudfront domain of mine. I should change that or else CORS is going to remain as an issue. And apparently the custom domain propagation could take up to 30 minutes, so I guess no is a good time to work on deploying the game server code to EC2.

What is the SOP for deploying to EC2? I have export.py, which syncs an export directory and uploads it, so I assume on the EC2 instance I would just download the code, unpack it, and run it. But shouldn't there be an SOP? I guess I'll make one now.

I made the SOP and it seems to work. Next, I should set up the client to look for the server at the correct address when it is deployed. Did I set up something for dev vs prod environments pointing to different servers in the client code?

I have something set up with `.env.production` and `.env.development` but I don't know what I did with them. But evidently we're using .env.development.

I found two good pages for this. First, this [React Environmental Variable documentation](https://create-react-app.dev/docs/adding-custom-environment-variables/) says that NODE_ENV is built-in and is set to 'development' for running `npm run start` but is set to 'production' when you run `npm run build`. But that doesn't seem to be working for me--maybe I can put it in package.json? It's probably because the server isn't a React app.

For Amplify, they have a [guide](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html) for setting up environmental variables, so I'll try it. But it has a disclaimer saying that these environmental variables are for the build stage, so I should focus on the React documentation. I think the problem is literally that I have the wrong setup in `.env.production`--I should point it to the EC2 instance's IP, which is 34.204.61.5 at the moment. I still wonder how I ever got the server hosting on my own address. That would be ideal.

So I just modified the URL to point to the EC2 server, but I probably need to do HTTPS, which is the whole reason I probably put the instance on the URL in the first place. So I should just buy another domain for hosting the backend, shouldn't I? Otherwise how am I going to enable HTTPS for it?

Well, the client doesn't seem to be complaining about the connection being HTTP or anything, so maybe it will still work? Now I just need to redeploy the server. To the SOP!

The problem might have been that I didn't include the port (:3000) API URL on the client side. Let's try that.

I should probably also install tmux on the EC2 instance so I can more easily see if it's running anything. But it looks like disconnecting from the instance halts the server.

It looks like last time I had this working, I somehow gave my custom domain to the game server. How can I do that again? I found [this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-ec2-instance.html) which seems to fit the bill.

I think the best solution is to get another domain name. But for now I can simply un-assign the domain name from the frontend app and use the default amplifyapp.com/ domain. Then I will assign it to the EC2 instance, following the guide. That way I'll know it has strong HTTPS coverage. Then I'll set the frontend to point to that target domain and we'll see if it works. For now I have to wrap up, so that's for next time.

Can I pause the EC2 instance? Yes, so I did that and now I'm logging out.

Logging back in. I'm going to disconnect the custom domain from Amplify and connect it to the EC2 instance. Then I'll follow [this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-ec2-instance.html) to make it point to my EC2 instance.

To make it clear whether I can access the server or not in general, I will add a basic `GET /` endpoint. I did that, and now I know that the EC2 server is publicly available and that its CORS is configured for origin URL sam-thompson-test-development.link. It turns out that since I can use a subdomain for the game server, I can actually share the subdomain, which is great. But for now let's change the server to have CORS for the source URL of the Amplify server, which is https://master.dgc1mgaykpjuw.amplifyapp.com. Then I also need to point the client to try contacting the websocket API at http://game-server.sam-thompson-test-development.link:3000/. Wait, why is it not HTTPS? That's the whole reason I pointed it to the domain in the first place.

This time, I got "mixed blocked" as the response instead of CORS errors, which is great progress in my opinion! But that means I'll need to host the server on an HTTPS address. How do I do that? First, I can try to configure a Route53 record for the base domain name and see if that works.

I followed Samuel Messigah's answer on StackOverflow [here](https://stackoverflow.com/questions/40761309/adding-ssl-to-domain-hosted-on-route-53-aws) to set up the certificate on Certificate Manager--let's test if it works now. Nope, it still is unable to certify. What's going on? The problem might actually be that we're using port 443 and the EC2 instance security zone can't handle that. But I definitely have 443 set up on the security group, so I don't think that's it.

Looking at the records in Route53, we have a CNAME record for frontend.sam-thompson-... but we just have an A record for game-server.sam-thomposon-..., so maybe adding a CNAME record for game-server will fix it? I don't think so since the purpose of CNAME is just to map host names to host names, which has nothing to do with HTTPS.

But I realize that the main problem is that HTTPS doesn't work on my EC2 instance, so of course I wouldn't expect it to work here. How did I have that working before? It looks like I should be using the https plugin from Express.

It looks like the recommended approach by Stack Overflow is to use a Load Balancer, so I'll try that. I have a link [here](https://repost.aws/knowledge-center/configure-acm-certificates-ec2) for guidance. So I'm creating an Application Load Balancer.

When I first made the load balancer, I set it to an Availability Zone that doesn't contain the instance. I need to use availability zone 1e, so let's start it over. I think I also need to use port 80, but I can't guarantee that. I just checked, and it looks like I don't need to use port 80; port 3000 works just fine because my instance group forwards traffic to that port on the EC2 instance. Nice! But I'm getting a WARNING when I try to use HTTPS--I think it's because I am using the record for my domain name but not connecting with that domain name.

So I added a CNAME record in Route53 to forward my custom game-server domain name to the DNS name for the load balancer, in the hopes that my browser would be happy with it. Let's see what happens. It worked!! https://game-server.sam-thompson-test-development.link/. So now what's left is to make sure this domain is plugged into the SPA and try it out.

It worked!!!! I now have a deployed Amplify app connecting to a deployed EC2 game server. This is excellent. Now I just need to adjust the user flow to reset the game after it terminates.

I also was wondering how to deal with the fact that reloading was broken for the client. But it looks like there is [documentation here](https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html) for a redirect that solves for this and accounts for the exact react-router use case I'm part of. It had a rule that I could literally copy and paste that fixed the issue. Amazing!

Next, I will make the server reset state when the game is over. I'll make it so that it doesn't start the game simulation again until players rejoin. That will essentially get me the correct happy-path flow. Then I can connect things up to the lobby action API to return the (dummy) game server IP. This is a huge success though, and it makes me very happy. Plus, this means I can use my one domain for the entire project (through subdomains) instead of purchasing a few.

## 2/11/2024

6:15 pm - 8:15 pm

Annie recommended I take another look at whether there's cloud services available for game server hosting, since it seems strange that EC2 is the only service that can handle this. So first I wanted to double check if there was an AWS solution, and I found some documentation [here](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift_quickstart_customservers_designbackend_arch_websockets.html) for Amazon GameLift, which seems to support something called a "GameLift fleet". Could this match my use case? It seems to involve a fleet instance being allocated to connect directly to the client, so it just might work. But I guess I'm confused about step 11 where it says the client connects to the IP of the game server, since it seems like the websocket library would reject this.

It looks really interesting, though, so I would like to check it out. It looks like the tutorial will need some time to initialize cloud resources, though, so in the meantime I can work on the game itself to have the user flow look very nice.

But it looks like GameLift is built for C++, C# and Unreal only, so I couldn't yet use a JS web app as the client for GameLift. But then I found [this Codeberg repo](https://codeberg.org/CodeOnCanvas/gamelift-realtime-client) that seems to exactly what I'm looking for--I wonder if it would work! We'll want to go back to this once I have the lobby management API working.

Apparently I don't have any instances running at all. What happened to my instance that was running the game server? I guess it terminated because it was stopped? My load balancer is also gone. Did I dream what happened yesterday? No, it's that I'm plugged in to a different region for some reason. Anyway, I should be developing locally.

For my coding today, I'm going to make the server reset the game when it terminates, and we will make the sure the client does NOT get to rejoin immediately. But ultitmately this needs to be up to something done by the lobby action WSAPI or some other system to (1) only spawn a game instance when it is demanded, (2) destroy the game instance when the game is done, and (3) determine which players are permitted to connect to which game.

So here's my decision: I'll scrap the instance allocation API and try going with GameLift once I have need for multiple game servers. For now I'll try one game server, one lobby etc. Either way, I think the best thing I can do is make the game experience itself look polished. So here's what I can do:

1. Make character starting positions make sense: DONE
1. Put a "waiting for players" screen in the client code for when not all players have connected
2. Put a countdown before the game starts
3. Reset the gamestate when the game ends

## 2/13/2024

9:30 pm - 11:12 pm

I'm working on making the frontend end-to-end experience polished by coordinating with the backend to start and end the game gracefully. I am tempted to work on the starting positions again to make them look good on the frontend, but I realize that's actually a frontend issue. So I'll keep the starting positions calculation unchanged. That means it's time to make the "waiting for players" screen.

So, how should it work? The screen should be owned by the frontend but should use the canvas so that there's no elements moving around once we load into the game. The screen should appear when the player first opens the page and the client should transition to the 'game screen' once it gets a signal from the server that the game is about to start. Then we render a countdown before the match actually starts.

So let's implement it like this: When all players connect, the game pushes a message to the clients saying that the game is starting and saying the timestamp at which inputs will start being accepted. Clients then display a countdown accordingly.

Progress update: I have the new signal implemented. Next, I should make the frontend show a loading screen (maybe with some debug information for myself) when not all players have joined yet.

I've now added an extremely simple and bad looking loading screen without a transition. But it behaves pretty much as expected, so that's great. For the next stage of the work, I'm interested in trying a proof of concept for GameLift with Node and React to see if it's possible to use it for my service. That would be very cool! As a reminder, the link for the library to make a WebSocket connection to GameLift is here: https://codeberg.org/CodeOnCanvas/gamelift-realtime-client. And ideally I should take their code chunk by chunk.

## 2/18/2024

9:15 pm - 10:35 pm
11:25 pm - 11:35 pm

Found a nice thread about unauthenticated user access to the app, which is exactly what I need to solve for mapping users -> game sessions:
- https://github.com/aws-amplify/amplify-js/issues/711

What should I do today? I am not sure whether or not I should generally aim to go for GameLift or not. My use case is not quite the one supported by GameLift, so I feel like it might not be appropriate for me to try using it at the moment when I already have a pretty simple architecture for game server assignment that will work fine. I think for my minimal product demo I'll allow game servers to host multiple game instances, but limit it to X (maybe 2) instances per server. That way I'll have horizontal scaling while still having full resource allocation! And that will mean I can host one cloud desktop that lets me demo a multi-lobby system.

So, where are we in the roadmap? I don't have the minimal game loop set up because the game doesn't reset fully after someone wins. I don't need to close any socket connections when the game resets; I just need to undo the effects of when the client joined the game. Where are we on that now?

Just walking through the user flow, here's what I notice:

1) The client just sees a frozen screen with "Player X wins!" on it. This is not necessarily a bad thing; the browser should navigate back to the lobby automatically but I shouldn't rely on that succeeding, so I'm using the "back to lobby" button.
2) When I go back to the lobby and then go back to the game, I get rejected from the game because there are already 2 characters connected to the current lobby.

I can wait for solving (1) so I'll focus on (2). I'm most interested in solving it through enabling unauthenticated users and making the server contact an API to check what user routes to what lobby. That sounds like fun, so I'll try it out using the resources I found today. So I'm starting by following [this comment](https://github.com/aws-amplify/amplify-js/issues/711#issuecomment-414100476). Unfortunately it means I might need to manually modify the identity pools.

I couldn't find the configuration on the console for the identity pool. But just to verify things, I checked whether the frontend could access unauthenticated credentials and I got this exception: "NotAuthorizedException: Unauthenticated access is not supported for this identity pool." So that means it is currently an identity pool setting. Is there not a way to enable unauthenticated users in Amplify using the CLI or JSON settings? According to [StackOverflow](https://stackoverflow.com/questions/53766100/how-to-properly-handle-unauthenticated-users-and-requests-in-aws-amplify-appsync) and the Amplify Android docs I can use `amplify update auth` and manually configure unathuenticated access. Indeed, there's literally an option for unauthenticated login if I choose to manually configure things.

I modified the Cognito settings to the best of my ability and I am now updating the deployment in the cloud. So hopefully now I'll be able to use an unauthenticated user. Sure enough, it's there now! What do I do next? I need to actually use this in my APIs. I can actually see the user in the Identity Pool on the web app, which is very cool.

So, where do I use this identity to convince the server of my identity? Here's how the end-to-end flow looks:

1. Client makes a websocket connection to a game server. They specify a game ID
2. Game server plugs them in to updates from that game
3. Client sends a request to join as a player in the game. They attach their credentials
4. Game server uses the credentials to verify their identity (using Cognito). Then they send the verified identity to an API to see if they belong to a game. If they belong to the game they're assigned to, they can join as a player.

What puzzle pieces am I missing for this? First, I need to put code in the server that verifies the user. Second, I don't think I have an API with an endpoint mapping players to game IDs.

First, let's do the simple problem: Identify a given user. How have I done this before? I think it had something to do with verifying identity using a JWT token. It uses a package called "aws-jwt-verifier" which I think I already have installed.

But after some research it came to my attention that this is an inherently unauthenticated user. I have my doubts because I have things like an "accessKeyId", "secretAccessKey" and "sessionToken" but I can just focus on those later. For now I'll just send the identityId and the server will trust the user without further verification. So the main tech we've gained is that I can automatically assign IDs to users that persist for their session, which is great!

So next I should make an API endpoint the server can use to check whether a user ID is associated with a game. Should this be on the lobby management API? Do I already have a table mapping users to anything in my plan? I have the lobby action API and it owns a table, so I should just make an API gateway for that table. It's public information anyway.

The lobby action API's table doesn't have a game ID. So I guess I need a separate table for the mapping from user ID to game. Is that a whole new API? I think it is. I need to figure out how this factors in to the whole architecture.

I think the data model should have rows (userId, gameId, lobbyId). Then it should have an API layer on top for getting all user IDs given a game ID. But the lobby action API already has (connectionID, userID, lobbyID) in a table, so I feel like that is almost all the information already. Should I just attach a second API Gateway to the lobby management API? I think that would be pretty simple.

But I feel quite tired, so I'll just lay out the plan for my future self.

- Define API contract and name for the gateway to verify user <-> lobby.
- Set up a system in the frontend to send an arbitrary (fake) user identity
- Stub the API integration on the game server to return a situation where 2 players are in lobby 1 and 2 players are in lobby 2
- use the frontend <-> game server interaction to assign players to the correct lobby
- Maybe make the "JOIN" request an HTTP instead of WS request so that we can map a specific response to it that the user can respond to?

## 2/19/2024

8:42 pm - 

What should we do? Well, I feel like reviving the Lobby Action API and making it public (with CORS) so that we can better test the lobby flow. That way we also would have a more coherent system for the server to see what lobbies exist and which identities map to them. But I think I'm getting ahead of myself and can get a faster result by just spoofing user IDs like I defined yesterday.

How should a game begin? I had two ideas:

1) user sends a request to join (as a spectator or as a player), citing a specific game ID. Then the server looks up the game ID and checks if the player is part of it. If they are, it boots up a game.
2) server has an HTTP endpoint for starting a game, which is sent by some API that knows when a game starts.

I like (2) a lot better because (1) is technically a race condition if two users connect to different servers at the same time. And I think this aligns with my original architecture, where the lobby action API calls a game server API. I just need to make the game server API send a signal to the game server. So let's get the user flow in order:

- Client  ->  LAAPI: "Start game" (everyone is ready)
- LAAPI    ->  GSAPI: "Start game" (data: lobby ID)
- GSAPI   ->  Game Server: "Start game" (data: game ID, lobby ID)
- Game server -> GSAPI: 200 OK (data: server address)
- GSAPI   -> LAAPI: 200 OK (data: game ID, )
- LAAPI   -> Client (data: game ID, )

I can't stub this super simply because I need something that coordinates between the client and the game server. I guess I could make the client call the game server directly on the "Start game" endpoint for now with a spoofed game ID and lobby ID. But I really feel like putting up some APIs with persistence so I can iterate on them.

For continuous deployment from commits, I found [this article](https://aws.amazon.com/blogs/compute/using-github-actions-to-deploy-serverless-applications/) which might do just the trick. But I'll ignore that for now since it's just a fancy version of using AWS SAM to deploy.

Resources for using a custom domain for the lobby action API:

- https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-api-gateway.html
- https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-regional-api-custom-domain-create.html

Like many things in AWS, it is suprisingly involved to do anything at all. Will I need to reconfigure this every time I re-deploy the API? And why am I getting a 403 error? Oh, it's because I was using the /Prod endpoint which doesn't exist.

After updating some permissions with the help of ChatGPT, I redeployed the API, and it still is hosted at the same custom domain. Great! Now let's see if I can process a message.

I still couldn't, and I was getting internal server errors because the endpoint the Lambda was trying to post to when communicating with the client was invalid. The problem is that my custom domain mapping removed the "/Prod" part of the domain, but I was still using that in my Lambda implementation. So I fixed that.

Now I have a working deployed websocket that's integrated with my app! Next, I want to modify it to use the player's login (or Cognito ID for an anonymous session) as their identifier. What should that look like? Right now, the table has lobby ID, ready status, and connection ID. It should have an additional field for user ID. Players should also tell the API what lobby they're in--they should probably make an HTTP request to the LAAPI to join the lobby before they can start receiving updates about player status.

But I think that actually gets me ahead of myself. For now I should focus on adding user IDs to the table but still have everyone in the same lobby. I'm going to need to include user ID in every request anyway so that we can associate the connection ID with the user ID.

That is pretty simple to do. Next, I should set up a system for the LAAPI or LAWS to send a request to the Game Server to start up a game. Let's summarize the next steps:

1) Create the LAAPI and deploy it. It should have two endpoints: (a) join the lobby, and (b) start the game. We only care about (b) right now. In the long run, this should be a totally private API.
2) Make a Game Server API hosted on the Game Server with a CreateGame endpoint to create a game instance.
3) Make the "start game" LAAPI endpoint contact the "create game" game server endpoint (with a list of allowed players) and send a response to the clients (with a game ID and) when the game creation is confirmed.
4) Make the clients navigate to the game server when they get the response back.

But actually, I think the LAAPI might not belong here at all, because LAWS needs to push the game server address to all clients. So I guess this is all done through the websocket API. TODO: Look into whether there's a way to asynchronously push info to clients in a serverless websocket API.

## 2/23/2024

10:19 pm - 11:55 pm (1h36m)
12:07 am - 12:45 am (0h38m)
12:57 am - 1:48 am  (0h51m)

Based on my steps lined out from yesterday, I should start with the HTTP LA API, on the same stack (sharing a DDB) as LAWS. But how do I contend with the fact that I don't know how to trigger a signal being broadcast to clients except in response to a stimulus from a client?

So I looked up asynchronous messages for Websocket APIs and I found [this webpage](https://about.grabyo.com/websockets-for-asynchronous-events/) explaining that the "Connection URL" can be used by the backend to send data back through the gateway. So any Lambda with permission can actually do the exact process I do to post to connections. That is exactly what I need, so let's try it with the `startGame` endpoint.

Also, I've apparently already set a domain name for an HTTP API in CloudFormation before--I did it for the lobby management API.

I also decided to look up validation for unauthenticated users again and found a [StackOverflow post](https://stackoverflow.com/questions/68077413/how-to-authenticate-guest-unauthenticated-users-with-api-gateway-cognito-authori) that says I should be able validate a "token" against the identity pool using a Lambda, so I'm interested in that.

I also ran into a CORS error which I've apparently already solved in the lobby management API. But it also seems that CORS isn't my only issue--I'm getting a KeyError from the response, and I figure the Lambda probably is trying to send a 500 response but is not including CORS headers on it. So I need to fix that and make sure errors result in a 500 response with CORS support. But what's causing us to get a 500 response? It doesn't seem to be appearing on CloudWatch logs for the Lambda function.

I just called the function again and this time it DID appear on CloudWatch and did not seem to report any error, but it get a 500 internal server error according to the client. Why?

The API Gateway console lets you make a Test request to the API endpoint in the browser, and my test request showed that the error is from a malformed Lambda response. So what should the Lambda response look like for a POST request? Should it contain a JSON field? My lobby management API does that, so I guess let's try that.

The problem was that I had the "message" field which is extraneous. Okay, why can't they just ignore it? But that's okay. Yay, it worked in the client! Now let's configure this to actually make use of the websocket.

Now it's evident that something is wrong with my logic that determines if everyone in the lobby is readied up, since it's saying not everyone is ready when it should be saying everyone is ready.

It looks like the issue is that when it reads the table it only reads the key, not the 'ready' column. How do I make it read the 'ready' column? It's because my projection expression explicitly includes only connection ID!

After fixing that, I got a 500 exception again. It's because we're timing out the request after 3 seconds, so I'll just increase the timer. But it's an issue that we're doing the requests synchronouslly--but that doesn't scale. I can modify it in General Configuration, and I assume I can do so in CloudFormation. When I increased the timeout, it took only 2 seconds to execute, but that's because there were no connections in the table.

The next time I ran it, it took 8 seconds and failed to connect because the URL for managing the API is apparently misconfigured. The solution was just to hard code the domain to point to the one I include in the certificate. Not ideal. So instead I made an environment variable in the template based on the domain--and that worked! Yay!

The next objective is to set up the API on the EC2 instance for starting a game, and then wire up the startGame API endpoint on the LA API to it. Then I'll have the full game loop. I think this also means I need to add identity as a field to the gameStart Lambda function, which is a great opportunity to try out token verification for unauthorized users. So, next steps:

1) Add identity (without verification) to the gameStart LAAPI endpoint.
2) Create an HTTP API hosted on the EC2 instance with a gameStart endpoint to notify the game server of the impending game + list of players.
3) Wire up the React code to it.

## 3/1/2024

8:17 pm - 9:13 pm (0h56m, remaining: 2h4m)

9:38 pm - 10:13 pm (0h35m, remaining: 1h29m)

10:33 pm - 12:24 pm (1h51m, remaining: -22 minutes; DONE)

What should I be working on today? I laid out some steps for myself last time I worked on the project.

The first step is to add "identity" to my gameStart LAAPI endpoint. I can do that by sending ID directly as a string without need for authentication, but I am going to take a second look at authenticating using a session token or something using an API attached to the deployment's identity pool.

A quick google search takes me to [this page](https://docs.aws.amazon.com/cognito/latest/developerguide/authentication-flow.html) where I can learn a bit more.

Also, I checked my billing for a second and found that Feb cost me $32, much of which came from hosting the Amplify app. That is fine with me for now so I can get the website running.

The article indicates an obstacle to me--you can use getID to get an OpenID token for an unathenticated (guest) user, but you only need the identity ID to do this. That implies there's no point in trying to identify with a third party that someone is logged in as a particular guest user, since anybody can submit any ID and be trusted with some additonal steps. In that case, let's proceed with just using identity ID for now, and authenticating when possible. Once I implement an experience that includes authentication, I can make sure that system verifies people using JWT if they are a real user before doing anything on the user's behalf.

So, let's add user identity ID to the gameStart endpoint. What does that even mean? It means I have to gather the list of players in the lobby and prepare to send them to a stubbed method for the "game start" method on the EC2 instance. Let's do that then! For now I can just print the list of players.

I've coded that up, but I really don't see a reason to deploy it without making the endpoint on the game server first. So let's go ahead with that. I have some other changes to commit too, so I'll organize those first.

Then I'll put together an HTTP endpoint for the server, called /start-game. The nice way to do this is with `express`, which I have installed already and forgot I was even using to serve a simple HTML page when receiving direct requests. Does it work?

[StackOverflow](https://stackoverflow.com/questions/7172784/how-do-i-post-json-data-with-curl) tells me I can test a simple JSON POST request with cURL:

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"players":['identityId1','identityId2']}' \
  http://localhost:3000/api/login
```

I realize this would be easier with ChatGPT but here we are. This didn't work because of Powershell having different syntax, so ChatGPT says I should do this:
```
curl -Method Post -Uri "http://localhost:3001/start-game" -Body '{"players": ["identityId1","identityID2"]}' -ContentType "application/json"
```

I was getting an error where requests had no body. The problem was that I need to use JSON middleware acccording to ChatGPT. Sure enough, that worked. Now let's follow the SOP to export and see if I can make the same request from the API gateway. I expect I'll probably run into a CORS issue, but maybe not!

ChatGPT also has suggestions for how to make a CloudFormation template that auto-deploys my instance and boots up the server, which sounds really nice for setting up and tearing down. I'll implement that once I get done with my current step.

I deployed a syntax error. Silly me. Well, this is at least probably faster than redeploying using a CloudFormation template, even if it's more manual. It looks like the allowed origin URL for the client is undefined, which seems like a problem, so maybe I should look at that. But first let's try a cURL request.

```
curl -Method Post -Uri "https://game-server.sam-thompson-test-development.link/start-game" -Body '{"players": ["identityId1","identityID2"]}' -ContentType "application/json"
```

I got a 502 bad gateway error. And clearly something is off because the game server has an undefined port that it's listening on. What's going on with that? It's  because of a typo in .env.production. I fixed it up by looking at the previous parameters in Git history, so hopefull that helps. Time to deploy once more!

And, it worked! That was actually so simple. But also I'm confused why it's searching for index.html sometimes. Is something sending GET requests to the server? It's probably health checks from the load balancer, if I had to guess.

Either way, now I can try connecting up to the API gateway, since the most important thing here is verifying that the parts fit together. It seems to work alright, but I'm noticing that it's printing nothing for the list of players in the request. Why is that?

It's because I needed to use the `json` arg for requests.post in Python. So now I have a bridge between the API gateway and the server up and running, which means it's time to configure the game server to make use of the identity IDs provided, and then make it simpler to deploy.

How should this be done? We should have mappings between clients, identity IDs, and game instances. And we should start off with no game instances. I also think it would be good to terminate game instances after 10 minutes or so to make sure there's no hanging instances, but I think that could be an optimization. So for now let's focus on decoupling game instances from game worlds themselves, if that makes sense.

I have to leave off now. But here's what to do next:

1) Finish splitting game instance management duties away from index.ts and over to GameInstanceManager.
2) Come up with a local test verifying the new process of game creation where you
first create a game with a list of players and then join with those players.
3) Set up CloudFormation-based EC2 deployment for this server code so we can do things in one AWS-managed command.
4) Do a demo of the first basic lobby flow (may require modifying some UI in the lobby to require the lobby action API to be working.)

## 3/4/2024

6:23 pm - 6:35 pm

9:47 pm - 10:20 pm

Let's continue splitting out game instance management duties out of index.ts and to GameInstanceManager.

It looks like it will be pretty complicated to manage players joining. But I should have a high-level client handler representing the interface between socket and game server, and then a lower level client handler representing the interface between game instance and client. So I'll make that separation.

The high level one will get a request to join a specific game, which is how we'll route them to the appropriate game instance to spectate or play. That game instance or game instance manager will send them signals about things like game updates. Ideally there should be a separation between game updates particular to the game and those not particular to the game, but I think I might mix those together for now.

So we might have the following interfaces interacting:

1. connection handler: internally defines the responses to sockets. Thinking of this like a method-based HTTP API in a sort of serverless model, it's composed into handlers of individual functions, each of which interacts with a single internal API that manages internal state.
2. game manager: The API that manages internal state. It should be on the level of a set of game instances.

So what's an example? This feels awfull complicated to think about. But the point is that there are multiple layers and each layer handles all API call types but only needs to know about their own set of them. So if a socket sends a "Join Game with ID X" signal, that is consumed by the outermost layer, but if they send a "Modify input" signal, that is forwarded by the outer layer and consumed by the inner layer.

But note that we can't technically do that since we can't make a handler for just any action. Or can we? We can, actually, but it looks like the better pattern might be this: One class per input. You can actually have multiple listeners to a single input.

## 3/5/2024

9:37 pm - 9:43 pm (6m)

10:18 pm - 10:52 pm (34m, total = 40m)

11:43 pm - 12:02 am (19m, total = 59m)

12:03 am - 12:24 am (21m, total = 1h20m)

I need to actually decide what the low-level code pattern will  be for the websocket handlers. Since it's a tough decision, I'm favoring just going for giving one set of handlers access to a high-level external API and one set of handlers access to a low-level API (specific to the game). Then I can initialize them when the server starts in order to route requests.

So let's get started with it, using the JoinGame route.

Next question: How do I make the interface for adding a player to a game without requiring JoinGame to know about the specific methods that a listener needs to have? Well, I guess it's reasonable for the game type to know about the methods that need to be on a listener, so it can manage the type. In that case, I just need to pass to the game the parameters necessary to instantiate a listener. So that probably means passing the socket itself, which means I need to have a socket to hand to the game.

I <3 beeps -annie <---- I love you too!

So here's how it will be:

- JoinGame passes player wrapper (with methods for sending messages) and game id to GameServer
- GameServerImpl passes player id + socket to the GameInstance
- GameInstanceImpl passes player id + socket to GameModel
- GameModelImpl uses a factory it owns to instantiate a GameModelListener that can handle the game-specific signals

## 3/7/2024

8:55 pm - 9:56 pm (1h1m, total this week is 2h20m)

I should be able to pick up approximately where I left off. But I regret smashing up the existing functionality in the process. It will be okay, though!

I managed to set up a working socket server that lets me plug in handlers and have them access the game server API. Excellent! Next I need to wire the endpoints back up so that they communicate with the server. Ideally I might try getting rid of the listener structure so that the game instance doesn't have to maintain references to clients that might have died.

## 3/12/2024

10:25 pm - 12:46 am (2h21m)

Where did I leave off? What do I do next? I need to wire the endpoints so they communicate with the game server. What's an example of the kind of user flow / input we're expecting and we'd like to handle?

1. LAAPI sends start game request, and we start a game
2. Player with id X joins
3. Player X uses websocket API to join game A.
4. Player X starts sending controls inputs.
5. Player Y uses websocket API to join game A.
6. Player Y starts sending controls inputs.
7. websocket API sends X and Y the 'game about to start' signal
8. Players X and Y send controls signals until game complete
9. websocket API sends X and Y game complete and game termination signals

Most if not all of these endpoints already exist, so let's translate them to our new system! We should start with the start-game request, but I'll skip it for now since that's not thet websocket API and it requires some design of its own.

So, what are all the endpoints that appear in the above model?

- joinGame: Joins the game as a spectator or player; we determine which.
- controlsChange: Sends a change to the controls.
  - This can actually be on the game server API side of things--as long as we are a transparent layer with respect to the data for the controls. Controls changes could really mean anything, and we can leave it to the client/game connection to handle that.
- createCharacter, resetGame: We don't need these, they can be handled by joinGame.

So really all we're missing is a mechanism for the ControlsChange message handler to send the controls information to the game instance. Let's make that happen!

So here's an interesting question: should the Game Server API be implemented through the individual actions of message handlers, or should it be an API itself that gets called by the individual handlers? I'm still feeling that it would be best to call the handlers. And, in fact, we can maximize the level of abstraction (and therefore hopefully simplify each part) by giving one layer to interact with.

The only concern is that this sort of trivializes the role of the message handlers, as they essentially are just a mapping between socket ids and methods on the GameServer API.

To make this into something we can verify through some kind of integration test (or manual test), let's quickly make sure we have something down for the start-game HTTP endpoint.

I've made some great progress toward actual functionality, and I have a test client that lets me test things in a more fine-tuned manner. So what comes next for me? Probably making a full test case (either an SOP or an actual piece of code) that tells me if the full process is working as I described above. That will mainly involve setting up the internal game instance manager API for the game instance to push messages to clients, and putting something on the frontend to detect it. But then I think we'll be in a good situation to integrate with the identity pool for verifying players can join a game, and then we really will have everything working together.

## 3/13/2024

9:40pm - 11:56 pm (2h16m, total this week 4h37m. TIME SATISFIED for the week)

So, what do I want to do now? I want to make a test client that lets me run an entire test SOP, and then I want to make it work. What should be the test SOP? Maybe I can make an automatic client. I'll give that a thought and update Windows.

1. Load client (not necessary for integ test)
2. Establish websocket connection
3. Send a 'start game' signal from an authoritative source
4. Send a 'join game' signal with the game as the target
5. Do this with two clients, expect game start signal on each client.
6. Expect controls updates on each client.
7. Internally cause the game to finish somehow?
8. Expect game complete and game terminated signals on each client 

This is all a nice test. But does it accomplish my goal of mapping players to game instances? Maybe and maybe not, but the point is that this flow should work for me when I'm done.

There's some socket.io [documentation](https://socket.io/docs/v4/testing/) for test setup with Jest, so maybe I can try that out for a bit.

And now I officially have a test case that works and involves two-way communication. This is excellent, and I quite like my method for two way communication that passes a uniform interface instead of individual objects for sending messages--it's quite clean.

So what comes next? Well, I should make a test case that starts the game and checks the HTTP response, and I should also try and connect to that game as a player. This might require us to set up player IDs instead of socket IDs, but that's test-driven development! Right now the test-driven development is leading me to define a method for assigning a player identity sent by the player to the socket. How would I do that?

I think in this case it's really best to model the actual network calls going to the server, which means I should extract the contents of main() in index.ts to a sort of ExternalestGameServer interface. I was thinking about adding an HTTP interface for clients to join the game, and I might yet, but that requires making a distinction between the start-game endpoint being unavailable to clients while the join-game endpoint would be available, and I'd rather configure that later.

Ah whatever, that won't be impossible. Let's do it. And we can just validate that there already exists a socket connection with the player who is trying to join. But actually the minimum case really has no need for a response to the joinGame request, so I'll just start with a test that verifies the game starts when both players join. And for now, I'll add a playerID parameter to joinGame, and then I will implement the mechanism for the game instance sending 'joinGame' message to players, which is going to be interesting.

Okay--where did I leave off? I was trying to get the "game that includes one player" case to pass. I had set up a whole pipeline to get messages from the game model to the socket clients, but I need to reconcile the problem where player IDs are socket IDs in the codebase but I want them to be user-submitted IDs. So I'll solve that in a non-authenticating way next time I pick up, and then I'll debug.

## 3/15/2024

7:20 pm - 8:32 pm (1h12m, weekly total 5h49m)

I will continue crafting tests using the integration test suite and use them on the server. I realize now that I don't have to encapsulate the entire server logic in index.js--I just have to actually run the server in one terminal and have the integration tests connect to its address in a second terminal instance. Let's try that!

I tried it and it works great, so I updated the README with some info on how to run the tests in the new style. But apparently the tests are breaking because I don't send a target game ID for the game to join, so now I should figure that out. That's because I no longer grab game ID from the game server directly, so I need to figure out how the client is supposed to obtain game ID. I'm pretty sure the design says they should get it through the /start-game interface, and that the LAAPI is in charge of this. But I guess I'll just send a POST request to /start-game in the unit test.

I got an error `ReferenceError: fetch is not defined` when trying to use fetch, and it seems it's because fetch isn't out-of-the-box for my Node version (https://github.com/mswjs/msw/issues/686). So I can install node-fetch with `npm install --save-dev node-fetch` and import it in Jest. But apprently that doesn't work for node-fetch 3.x so I am just using node-fetch 2 for now in package.json and that seems to work. But there's a lot of saltiness on GitHub https://github.com/node-fetch/node-fetch/discussions/1503.

Now I can go back to figuring out why the player doesn't get a game-start notification. The bug is that there are 0 players necessary to start the game but we have 1. Why are there 0 players necessary to start the game? Because I didn't make the test correctly send the JSON data to the client (I forgot the JSON content type header). After some more tribulations, it works! I now have a test case where a game is being created and a client is joining it. Next I should have a situation where two separate clients need to join to start the game, since that is the minimum game instance that can actually make sense. After that I can start messing around with character controls, perhaps even verifying that they modify the game state.

## 3/18/2024

10:37 pm - 11:13 pm (36m, 36m total this week)
11:25 pm - 12:17 am (52m, 1h28m total this week)

I figured I should realign with the overall objective for a second here. I'll run the client and see how it interacts with the server in its current state. I figure what we're missing is a mechanism for providing updates to the client about gamestate. But I can't even get to the local game server because the lobby screen relies on the prod LA API to start the game, which probably can't contact the game server because it's not running. So, can I use a URL? I should be able to send a 'start-game' signal directly to the game server to test this, but that feels like it's against the point. So I'll go back to the integration test for now to check that we get game updates.

So, what do we modify to send character updates? The same thing we modified to send the 'startGame' message. That means adding the method to GameInstanceManagerInternal for updating a specific character. But I'll just make a generic method with unknown schema for sending a 'game status update' and let the client figure out the rest. Right now it looks like characters send updates to GameListener entites, but to minimize interaction bypassing interfaces I should just make the GameModel act as the 'GameListener' and make the interface a 'CharacterListener' interface. The only method it needs is `handleCharacterUpdate`.

Now I've got the message routing working, but the game server isn't actually driving the game instances! So now I need to add the system for driving the game instances. So--who should own the logic for the # seconds delay between all players joining the game and the game actually starting? I think maybe it should be the game rather than the instance manager, which makes things very simple for the instance manager.

So I got that working and I officially have games controlling their own delays before game start. This makes things pretty versatile, since now I can potentially even do things like send updates prematurely for intro animations. My new mistake is that I forgot to actually plug in the GameModel as a listener to its characters, and I forgot to create characters for clients who are part of the game. Now I do that, but I provide socket ID as the player ID to the game instance, whereas I should provide player ID. How do I set that up? I did it by setting up a handshake that sends player ID, and that will be where I can tie in authentication!

But now I have a full test case where players join a game, the game starts, and we get status updates. Nice! Next I should make a test case for players sending controls updates to characters and having some kind of in-game value change like position. And lastly we can set up the game end condition (probably with a debug "forfeit" message) to verify that it's working as expected. Then we'll be ready to do a Prod/Beta test where we upload the server code again. I'm happy that the progress is measurable.

## 3/19/2024

8:54 pm - 9:40 pm (0h46m, 2h14m total this week)

As stated yesterday, my next move is to make a test case for payers sending controls updates to the game and having the player position or animation change. But first I'll take a moment to split up the 'two player game' test into sections.

Okay--I think I've set up the test. Now, why does the character not move to the right when we send the 'moveRight' 'pressed' control update? This probably requires some logging sleuthing.

## 3/20/2024

6:45 pm - 8:03 pm (1h18m, 3h32m total this week)

Let's continue with the investigation to see why the character controls update doesn't change their x position in 5 seconds. But first let's quickly restart my computer to see if we can get rid of the keyboard issues I've been having.

Okay, I'm back. So, what fires? Well, I can start by re-running the tests--I think I turned off the logging for the 30 fps updates so I shouldn't be bombarded. I had to remove just a couple extra messages.

It looks like the problem is that we're sending an undefined controlsChange. How come? It's because I formatted the message less deeply than I was supposed to.

The next problem is that we can't derive the character associated with the player ID on the controls update. So let's fix that. Should a character have the same ID as its player? I think so, and I see no reason in complicating anything by decoupling the two concepts.

Looking at the logs, it seems the controls change definitely caused a deltaPosition to appear. Why is it not reflecting in the position for the character?

Well, it's likely now that we're not actually reading the right character ID, which is why we're now failing 2 test cases instead of 1. So let's try reading the correct character ID, which is the player ID.

I've found it! The reason the test was failing was because my original handler was still working. Every time I got an update from the game server, I wrote the x position to `characterStartingX` with the first handler, then compared the value in the second handler, which meant they were always equal. How do I fix this? Just by doing a check for `undefined`. And after fixing that, the tests pass! Excellent, now I can move on to a test for getting signals when the game ends. Let's have forfeiting be a signal at the GameServer level so that it's not just controls.

Wow--it worked! So now I pretty much have an end-to-end situation where a game is completed successfully, which means we can deliver the user experience. So I think the next thing we should do is upload the server code and use it in concert with the LAAPI and client to get us a full lobby experience. Exciting!

But before that I think it would be clean to do two things:

1) make sure the game instance can terminate itself so we don't have memory/compute leaks.
2) commit all this now that we're back in a working game state.

Now I've done both of those things, and I really ought to upload my changes before I lose them in some freak accident. Don't intend to jinx it though :).

I suppose I could also try to contrive a way to test this offline with the client. But I feel like I'm at a decent stopping point since I'm having trouble focusing.

## 3/26/2024

10:10 pm - 10:21 pm (11 minutes)

Okay, I pushed my changes and now I have everything safe and secure. The next step ought to be to upload the server code to an EC2 instance and test everything together. But I know that I made some changes to the way the client talks to the server--mainly through the introduction of the identification handshake--so I should develop that locally.

But the problem is that in the current control flow, the client needs to get through the lobby action API to connect to the server, so I can't actually get the server starting up. But I can solve that by just adding some debug controls to the client, so I think I'll give that a try. I can just gate the debug controls with a query parameter if I want them not to be there for users.

So let's start by just running through the client experience and see what needs to change to re-enable local development.

The current blocker is that I hit a 500 error when I press the 'Start Game' button, which makes sense because the game server isn't online right now. So I just need an option to bypass this and use the local server instead. Simple enough.

## 3/27/2024

8:25 pm - 8:56 pm (31 minutes)
9:15 pm - 10:32 pm (1h17m)
10:42 pm - 10:49 pm (7m, total 2h6m this week)

So--I hit a 500 error from the LA API (not LAWS) when I click 'Start Game'. I need to bypass the LA API. So I'll add a checkbox that appears only when a debug flag is set to true, and the checkbox switches us over to directly calling the game server API's start-game method.

Now I've got the game loop active, but for some reason we're sending an undefined game start time and never actually running the game loop within the model. Why? It's because I don't send a game start time from the server to the client, since I just start the game instantly for now. I need to add some data flow controlling that.

The next issue I'm facing is that the game ID is set to 1241 on the client uniformly. Where did that come from? It came from me hard-coding it right there in the code. Fixed that.

Next issue is that apparently I was sending an empty players list to the game server. I guess I formatted the message incorrectly. And I'm also apparently not passing the gmae start time properly either, I think. The first issue is probably because I wasn't using the content-type header. That indicates that fetch is too low-level of a tool, honestly.

Now I've messed up the HTTP request to the serverr--it's coming back wtih some sort of error for CORS reasons. What did I even put in the request before to make it work alright, and why isn't it working now? I put `mode: 'cors'`. I'm very lost--I don't understand what I changed to cause this problem. But how is this a CORS issue if the server isn't even receiving the request??

The problem doesn't happen if I use the following for the request:
```
const startGameResponse = await fetch('http://localhost:3001/start-game', {
  method: 'POST',
  body: JSON.stringify(requestBody),
})
```

...But the server doesn't actually get the data in the body. But the problem starts when I add the header indicating that I'm sending JSON. Then it just totally rejects my request before it even reaches my code. That's really annoying! How do you send a fetch request to a local server for POSTing JSON data? I don't even know!

Well then, for now I guess I'll just pretend the request works and put a FIXME so I can move on and think of the correct answer later. Even when I set mode to 'no-cors', which presumably bypasses all the CORS craziness, it STILL fails to send the player data. Maybe I have the data schema wrong for the request data?

Once I hacked that together, I managed to get into the game, where my character was immediatetly the victor because there was only one player--pretty boring. So next I should make a debug mechanism for logging in using a custom player ID and test a game with multiple players.

Where did I leave off?
- Solve the issue with the POST request not being recognized by the server
- Finish the process for sending debug identity and join game signals from client UI, to run full game demo.

## 3/31/2024

3:54 pm - 4:54 pm (1 hour, weekly total 3h6m. Good!)

Let's solve the issue with the POST request not being recognized by my server. So first let's replicate the issue.

ChatGPT handily answered my question! The problem is that I was lacking middleware on the Node side for parsing the request JSON. So I need to get `body-parser` and use it in the app.

But it turned out I actually had JSON body parsing configured already--the problem was that I didn't have CORS configured to properly handle the pre-flight request. Once I got that working, it went without a hitch. Nice!

Current scenario that I'm trying to get to work:

1. close all client tabs
2. ensure server isn't running
3. run the server
4. open client tab 1
5. on client tab 1, join the dev lobby
8. on client tab 1, enable debug mode, ready up, and start game
9. on client tab 1, send your identity as PlayerID1
10. on client tab 2, join game
11. open client tab 2 by navigating to the URL for client tab 1
12. on client tab 2, send your identity as PlayerID2
13. on client tab 2, join game
14. verify that this starts the game
15. verify that things looks good on the frontend

Right now I'm running into an issue where the image being rendered by the client is apparently broken. What's going on with that? It probably has something to do with the server sending invalid player states, so I'll want to fix that. I am able to replicate it with these steps:

1. close all client tabs
2. ensure server isn't running
3. run the server
4. open client tab 1
5. on client tab 1, join the dev lobby
6. on client tab 1, enable debug mode, ready up, and start game with lobby players ['PlayerID1']
7. on client tab 1, send your identity as PlayerID1
8. on client tab 1, join game
9. verify that this starts the game
10. verify that things looks good on the frontend

## 4/2/2024

9:40 pm - 9:50 pm

10:00 pm - 10:20 pm

10:35 pm - 12:32 am

Where did I leave off? Looks like I have an error in client-server communication. Let's see the error messages and find out if we can get to the bottom of it.

The error I'm getting is `CanvasRenderingContext2D.drawImage: Passed-in image is "broken"` at DrawableGameCanvasImpl line 65. Let's see. Did we switch around some filepaths that invalidate an import for the image? Or possibly we don't include it in the static assets since I changed how the Express server is constructed?

It looks like the problem starts with the loading screen, when we render an image with source `"../gui/loading_screen_placeholder.webp"`. So what would happen if we just rendered that one image as an img tag? The first thing I notice is that nothing actually draws, so I figure that's part of the issue. What happens if we replace the image? I also notice that when I mouse over the image element in the DOM, it says 'Could not load the image'. Is there a corresponding network call? Yes, and it seems to call to localhost:3000/game/gui/loading_screen_placeholder.webp, so that seems like a problem. When do we even draw the loading screen?

It's not a problem with the image--the same thing happens if we use the Street Fighter background image as the loading screen instead. What's going on here?

The URLs were messed up apparently--that's confusing. But apparently this doesn't work: `"../gui/loading_screen_placeholder.webp"` while this does: `'/gui/loading_screen_placeholder.webp'`. Good to know.

Now I just need to fix up the part that loads the character sprites since they are experiencing the same issue. I found it and just removed the leading ".." and now all the sprite loading works. Nice! What comes next? Probably the two-player local example.

The two-player example seems to be working as well, but I don't seem to be able to get the character to move or attack with my controls. Why? I can start by looking in the controls handler to see if we're even receiving player input. Actually, it looks like we already log that, so maybe the problem is in the client. Yep, looks like we send as a different message type. Actually that's not the problem on further inspection--it's really that we don't send the controls with the correct schema.

And with that change done, we were able to complete one game instance in its entirety. Now I just need to make the client redirect back to the lobby upon receiving a game termination signal. Well, maybe I don't need that, but I at least need a button that will take the player back to the lobby, even if the game provides a debrief screen of some sort. But I already have that--does it work? Yes it does.

I then tested the flow for playing multiple games in a row, and it seems to work fine if we get the same players to boot into a subsequent game. Nice! Does that leave me anything to do before I put the server code online and give it a go? I don't think so. So let's stop being so afraid of putting it online in that case!

TODO: Look at launching an EC2 instance with CloudWatch for this instead of deploying to the same instance every time.

I deployed the server code and ran it, and when I tried to start game using the LAAPI I got a 500. Why? It's running to an error saying `'bool' is not callable`. Can I print the stack trace? Looks like the issue is in all_clients_ready, where we call client.ready even though it's just a boolean. But it looks like we define `ready` as both an instance var and a message in Client.py--so I should just put an identifier before the private variables.

I think it worked--I've made a game! Yay! I should quickly copy over the modifications I've made to the Python  code for the LAAPI.

Also TODO: Define an index.html or something to satisfy the health checks from the load balancer.

On my first run through, I got served a game, but my browser redirected to an undefined game ID, so I did not connect succesfully. Why did that happen? Because I'm expecting the Lambda to send the game ID back to the client but it doesn't. Let's fix that.

Sure enough, we're not even attempting to send a game ID. But we're obviously NOT supposed to get the game ID from the response to the POST request, because the startGame message is supposed to be broadcast to all clients!

Now I've got the system operational for redirecting based on a socket response. And that allowed me to create a one-player lobby successfully and carry out an insta-win game, but only if I hard-coded the player IDs in the Lambda. So the last thing I need is to figure out identities, I think. How do I attach an identity ID to a client in the table?

Players get an entity ID when they update their status, which they have to do at least once to start the game. So I should be fine to modify the LA API to extract identities from the table. And I have debug mode on the clients to get them sending any identity ID I fetch from DDB, so I shouldn't need any code changes there.

Note also that identity IDs will duplicate unless I use an incognito browser (or maybe another browser, not sure). But this time I ran into another error: The Lambda is sending None as the identity IDs for the lobby.
```
list of client identity IDs we're sending to the game server: [None, None]
```
The reason: It's because I misspelled identityID in Client.py.

This time it worked! So now if I just modify the client to send their identity ID automatically, I can get a fully automatic game loop from lobby to game and back to lobby. That's so exciting!

## 4/9/2024

8:48 pm - 8:59 pm (11 minutes)
9:29 pm - 11:25 pm (1 hour 56 minutes, total 2h7m)


Where did we leave off? We were testing the full game loop, and then I was going to make a change so that the frontend would automatically send the identity ID if we're not in debug mode. But right now I want to try the end-to-end flow again, just to show myself it still works.

So, here's what to do:

- [DONE] Find out how to let the EC2 instance run the server even when I'm not there.
- [DONE] make debug mode NOT the default option, unless a query param makes it so
- [DONE] outside of debug mode, in Game screen, send identity to server and join game automatically
- add the lobby system
- outside of debug mode, don't enable 'start game' button if both players aren't ready
- make a countdown on game start so that players have a moment to prepare after loading

### Run the server in the background

[StackOverflow](https://stackoverflow.com/questions/32500498/how-to-make-a-process-run-on-aws-ec2-even-after-closing-the-local-machine) says that I can use `screen`--is that installed by default?
```
screen
```
Yes I do! I can detach with Ctrl+A followed by D. Then I can re-attach with
```
screen -r
```

### Send identity on page load

Looking at [reddit](https://www.reddit.com/r/react/comments/14upcmi/fetching_data_from_an_api_upon_page_load/) has me interested in "React Query" which can prevent the need for me to use a useEffect to carry out an action on page load. Let's see what that is. Apparently now it's known as [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview).

Looking at the docs, I think it would be good for me, honestly. Let's try it. Looks like installing it requires updating React though, so I went ahead with that using `npm install react@latest react-dom@latest`. I also had to update `@testing-library/react` the same way. I also had to follow steps on the React docs (https://react.dev/blog/2022/03/08/react-18-upgrade-guide) to updgrade.

Now I'm running into an issue where every time I connect as a local client I am seen as 2 clients by the WS API. What's going on there? It's an issue with Lobby. But updating to the lastest version of react-use-websocket fixed the issue immediately. Nice!

I hooked up the useQuery thing, and I think it works, but I also think I might be abusing it since I'm not actually returning anything meaningful. But I'll just work with it for now since I have the desired effect.

Next, let's think for a second about what we're missing for the end-to-end lobby system. We have a Lobby Management API which lets us create a lobby and get a list of all lobbies, so I think we're missing two main things:

1) Allow clients to create a lobby
2) Make lobbies disappear when the host leaves
3) Allow concurrent lobbies to act independently (probably a LAWS / LAAPI problem)

We should prioritize (1) since it's the only step necessary to have a real end-to-end flow. Exciting! I think it involves creating a 'Create Lobby' page with a couple details. What are the details?

- Lobby name
- Max player count

Well that's super simple. Let's go ahead with it.


To do next:
- Finish up flow for creating lobby through LMAPI on client
- Test end-to-end flow to verify sending identity + joining game works

## 4/12/2024

6:44 pm - 7:17 pm (33m, total 2h40m)
7:41 pm - 7:54 pm (13m, total 2h53m)
8:00 pm - 8:03 pm (2m, total 2h55m)
8:00 pm - 8:06 pm (6, total 3h1m)

Where did I leave off? I was going to put together the frontend integration with LMAPI. That sounds perfectly reasonable so let's go ahead with it. I should first check--is the LMAPI currently deployed? And as a side note, is there a way to auto-deploy something like this from a GitHub repo? Looks like I found something about that already, [here](https://aws.amazon.com/blogs/compute/using-github-actions-to-deploy-serverless-applications/).

Anyway, checking my AWS account now for the API Gateway deployment. I do NOT have it deployed--let's go ahead and deploy it with `sam build` + `sam deploy`.

Don't I need to also connect it to a static subdomain of mine? How did I do that with LAAPI? It looks like my deployment actually failed because I was requesting a non-existent ticket. Let's fix that. Yep, it looks like we were trying to tie ourselves to the base domain name. I'll fix that. I think I need to go to Route53 on the console and manually create a cert for the subdomain. No, actually I need to go to Certificate Manager.

I've made the cert and updated the template. Let's see if it works now--I know that in the past I've needed some time for things to propagate though.

That seems to be working, or at least not failing as quickly. What can we do on the frontend? Well, now I know that the domain I'm using is lobby-management.sam-thompson-test-development.link, so I can construct the client around that.

Alright, I've set that up. Time to test it. It's getting a 404. Why? Because it's not recognizing the endpoint I'm giving it as a full URL because I forgot the HTTPS prefix.

I tried it again, and this time we're getting a 502 bad gateway error. I think that indicates an issue validating the HTTPS request, which means there might be an issue with the cert I used? Oh, it's just a 502 because there's a CORS error, so I can fix that with a header in the server response. But there's also an internal error, probably due to the issue I saw when testing in API gateway where it couldn't parse the max player count.

Let's solve both of those. First, I'll add the `access-control-allow-origin` header in the server response. Actually, it's already there--it's just missing because of the 500 error preventing us from attaching the header. So I just need to solve the 500 error.

The problem probably originates in us needing to use a `body` field or something in the JSON request for the Lambda to parse. Do I have an example where I call a Lambda API function with a payload? Probably in start-game right? But that one works just fine, so I really don't get it! But I can just modify the Lambda to print out the full `event` object to resolve this.

## 4/13/2024

4:16 pm - 4:27 pm (11m, total 3h12m)
4:33 pm - 4:48 pm (15m, total 3h27m)
7:00 pm - 8:27 pm (1h27m, total 4h54m)
8:47 pm - 8:55pm (7m, total 5h1m)
9:16pm - 9:43 pm (27m, total 5h28m)

Currently debugging--and I think there are two different Lambda functions for CreateLobby and only one is used, which is annoying. So let's put some debug prints in the Lambda function that's actually attached to the API. Actually, that wasn't the issue--I just misplaced the debug print statement. But the problem is that I was extracting the parameter values from `event` when I should have been using `event.body`. I'll fix that.

An example of doing this correctly is in the Lambda for the LAAPI's startGame function:
```
lobby_id = json.loads(event.get('body')).get('lobbyId')
```
So let's follow that pattern. And with that, I finall have a working request-response example! So does that mean we can now see the lobby from the client? Yes! But when we click the button to join the lobby, it takes me to a blank page. So that's the next thing to fix. It looks like we're definitely receiving the lobby ID, so we just need to plug that in to the URL we're navigating to.

That's fixed up, but it points us to another issue, which is that we don't derive the lobby name from the lobby ID if we load the page. As a result, sending a link to the lobby will not let the website know the name or max player count for the lobby we're in. We can fix that with a new `getLobby` API endpoint on the LMAPI. That also would prevent us from loading the lobby page for a lobby that doesn't exist. But that's not really necessary right now; instead I should focus on making the LAAPI know which lobby you're part of, since right now you get all player updates even if the player is in a different lobby.

How do I fix that? Well, I did something similar in the Game Server socket API. I just need the table of player connections to assign each connection to a lobby, and to query by lobby when broadcasting updates. The table already has a lobby ID actually, so that's mostly squared away.

What I really ought to do is make an HTTP API endpoint for when the player first joins the lobby. And I think I will go ahead and do exactly that. The endpoint will be called `/join-lobby` and will be on the `lobby-action-api` subdomain. It will require the player to send their identity ID though, and I don't quite know how to match that with their table entry. So I'll figure that out in a bit, I guess. In that case I'll just make the `get-all-statuses` message be the handshake for setting the identity ID and lobby ID associated with a connection. I have to make sure that message endpoint has the right to write to the DDB. And in fact, I already have an API for lobby action!

ChatGPT pointed me to this thing called a 'GlobalSecondaryIndex' that I might be able to use, so I'll try that.

And sure enough, I got a permissions error because I forgot to give the Lambda permission to write to the DDB. Let's try this again. I fixed that, but now it looks like we're always getting an empty list for the statuses, which implies there's something wrong with our query. The problem was that the code was using `lobbyID` while the table was using `lobbyId`. Silly. So I fixed that. Next, I'll make sure that the update_status function only gives updates to players in the same lobby. Also need to make sure the same is true for disconnecting and starting game.

When I left off, I was modifying the LAWS / LAAPI to broadcast updates about a player only to the clients in the same lobby as the player, so that there's isolation between lobbies. I'm considering switching the table over so that the primary key is identity ID, and that players don't get added to the table (and are therefore not subscribed to updates) until they are identified. But that could get confusing so I don't think it's needed right now.

## 4/14/2024

1:24 pm - 1:37 pm (13m, total 5h41m)
3:00 pm - 5:06 pm (2h6m, total 7h47m)
5:35 pm - 6:50 pm (1h15m, total 9h2m)

I am continuing to adjust the LAWS / LAAPI to only notify members of a lobby. For the LAAPI start-game endpoint, I need to use identityID since there's no inherently connected connection ID. Which means I need a GSI for identity ID, which is perfectly fine.

I've now figured out how to share code between Lambda functions using [this Medium article](https://medium.com/bip-xtech/a-practical-guide-surviving-aws-sam-part-3-lambda-layers-8a55eb5d2cbes), so that works pretty nicely. But it looks like when I send an updateStatus message in the lobby it doesn't broadcast the update back to me, so I need to fix that.

I think the problem was that I was taking the result of the Table.get_item method (python docs [here](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb/table/get_item.html)) and fetching its `item` field when I was supposed to get its `Item` field. Fixed that.

That was enough to make updateStatus work within a lobby. Now I need to check that it isolates status updates between lobbies. It does! This is awesome--I guess that means I can now rely on my infrastructure to determine which players are in which lobbies, which is very cool. What comes next? We should try actually starting a game from one of the lobbies and see what happens.

It failed with a 500. Why? It's because I am not de-stringifying the event body in the Lambda for it. Let's fix that. I realize that the server won't allow me to connect unless I'm running the frontend anyway, so I'll make sure the frontend is deployed and do the remaining tests from the prod website.

I get a CORS error when fetching the lobbies list on the prod frontend. Why? Because I'm fetching from the wrong URL, implying that we didn't auto-deploy the Amplify frontend with the new URL. It looks to be connected to the new Tanstack dependency.

When I left off, I was going to test the end-to-end flow using the prod frontend, but the prod frontend was failing to build due to something having a React 17.x peer dependency when running `npm install`. I don't know how to fix that so I'll need to look into it. ChatGPT pointed to a specific dependency issue where I was expecting React 18.2.x but Tanstack uses 18.0.x, so I modified package.json to require 18.x and we'll try from there. I'll check in 10 minutes.

I went back to basics for a bit and found the repo for react-use-query [here](https://github.com/TanStack/query/blob/main/package.json), and I could find their package.json which listed explicit versions for many of the packages that presented dependency issues. So let's try building, again.

For now I might just need to abandon Tanstack since it introduced the issue in the first place and I can't seem to get rid of the problem. That's annoying.

## 4/15/2024

9:05 pm - 10:40 pm (1h35m, total 1h35 this week)

When I left off, I was struggling with an incompatibility between the following dependencies:

- @tanstack/react-query
- react

I really coudn't figure out something to do. So I reverted back to the last version of package.json that works and I'm going to iterate from there and see what the problem is.

So I think the move is to first make a build that works for npm install, then update all dependencies and try building that, and lastly adding @tanstack/react-query and trying to buid.

To update all my dependencies, I do the following:
1) `npm outdated`
2) `npm update --save`
3) remove node_modules and package-lock.json
4) npm install
5) commit

That didn't help. Then I really thought that making sure I have the same Node version as the AWS Amplify machine would allow me to replicate the issue, but I saw that it's using Node 14 and I switched to Node 14 using NVM and did `npm install` without a hitch, so that's not the problem.

That said, given the Provision step they have in the console, I could try replicating their whole environment in EC2. I'm also curious about one of the earlier deployments I had where the issue was entirely some peer dependency thing with `aws-amplify`, so maybe I can grab some of the versions from there.

I wonder if committing package-lock would help? I recall that it's not supposed to be ignored. That was build 18.

Adding package-lock.json worked--the frontend built successfully, with Tanstack and everything. Amazing!!! So does that mean we can go through the whole user flow? Yes. Everything worked great up to connecting to the game server--then the server crashed when starting the game (implying that it successfully detected the players joining!) with the following message:

```
Error: Cannot determine position for a character with index 2 because there are only 2 players expected.
    at getCharacterPosition (/home/ubuntu/app-info/bfg-server/build/GameModel.js:37:15)
    at GameModel._GameModel_createCharacter (/home/ubuntu/app-info/bfg-server/build/GameModel.js:205:34)
    at GameModel.addPlayer (/home/ubuntu/app-info/bfg-server/build/GameModel.js:77:180)
    at GameServerImpl.joinGame (/home/ubuntu/app-info/bfg-server/build/game_server/GameServerImpl.js:60:24)
    at JoinGame.handleRequest (/home/ubuntu/app-info/bfg-server/build/socket_api/message_handler/JoinGame.js:13:29)
    at Socket.<anonymous> (/home/ubuntu/app-info/bfg-server/build/socket_api/SocketAPIImpl.js:73:21)
    at Socket.emit (node:events:524:35)
    at Socket.emitUntyped (/home/ubuntu/app-info/bfg-server/node_modules/socket.io/dist/typed-events.js:69:22)
    at /home/ubuntu/app-info/bfg-server/node_modules/socket.io/dist/socket.js:704:39
    at process.processTicksAndRejections (node:internal/process/task_queues:77:11
```

So that gives me a clear spot to resume the coding--it seems we have an off-by-one sort of mistake with character index. But I'm just so stoked that adding the package-lock.json made this work, that's a total life saver.

## 4/16/2024

6:19 pm - 7:23 pm (1h4m, total 2h41m this week)
11:16 pm - 12:13 am (57m, totall 3h38m this week)

Objective for today: Figure out why the server crashes when two players connect like normal. I should be able to replicate this locally. But I can start by looking at the game server logs.

I entered copy mode and scrolled up through the history in `screen` and it pointed to line 37 of GameModel.js.

It looks like we got 3 requests to join the game from the same player: us-east-1:30692b31-20d5-cc42-0c18-a16094216878. Why is that? Either way, this reveals an issue. Since we have a Set of players, we automatically de-duplicate the list of players. But we always add a new character.

So what happened is, we got 3 requests from player A. Each request resulted in setting the size of the players Set to 1 but created a new character belonging to player A.

The fix seems to have worked somewhat. But one of the players was able to join the game and then won immediately while the other player never joined the game at all. What happened? Why did they not get the signal? The implication is that it got sent out before the connection was established. But how can that be? I need to figure it out.

It looks like we logged the "Starting the game..." message twice--once for each player connecting. So I think I still messed up the logic for when to start the game, though it was slightly better this time. I also need to de-dupe the list of identity IDs who join, since there was actually only one identity ID involved.

Yea, the root of the problem is that I'm always getting the same identity ID. What if I try one tab in the incognito browser and once in the main browser? Then we get two identity IDs and it works perfectly! YAY! So now I just need to make the server handle the same player joining in two tabs as if they are the same player. So the list of expected players should be a Set.

Now the game is a little bit less silly when you lobby up twice as one person. I should also test whether you can have two games playing simultaneously. Then I want to set up the system to delete lobbies when the last player leaves them.

It looks like we do in fact vibe with multiple games running simultaneously. Excellent!

Now, how do we make it so that the last person leaving a lobby causes it to be destroyed? Well, we have an on_disconnect handler for the lobby action API, so I just need to make it call a new endpoint on the lobby management API that deletes a lobby.

I added the new API endpoint--it's quite easy, but I need to test it on API gateway to make sure it works. Next I need to add the logic into the LAWS to check the lobby for emptiness when a player logs out. I've marked the location to search.

Let's test the new API endpoint. Let's delete the lobby with ID 187a1928-5b0f-459b-9749-04766956f38b. But I need to make more changes to the lobby management API code. So that's where I left off.

## 4/17/2024

7:51 pm - 

I don't have internet and I'm real cramped, so I'm just messing around with some CSS styling today.

I did some work on styling, and now I feel like working on Ryu. I think the best moves for the meta would be to add a low punch or kick from crouching stance. It could also be good to add a low punch or kick from standing that is able to hit the crouch since there is no way to hit someone in a crouch right now. It is tedious to mess with animations but I have some time right now so maybe I could try it.

Beyond that I can make it so you can jump, or make it so you can't walk offscreen. I think the jumping will be pretty complicated and calls for adding aerial moves, so I'll skip that for now. So here's the sequence:

- make characters collide with the edge of the arena instead of it going forever
- add a low attack from standing
- add a low attach from crouching

How do I mess with the movement? Well, the Game applies movement each frame so perhaps I should add it to the logic for resolving movement. Where is the main game loop?

## 4/19/2024

7:30 pm - 8:22 pm (52 minutes)

Chilling on the plane. I want to add a low kick attack to Ryu. I'm recording an SOP for it at the same time to make it easier and hopefully identify the steps for improvement--like an animation editor.

Now I'm trying to test out the new animation. It has the novel property that it requires pressing two keys at once. But the first thing I see is that the heavy attack control isn't working anymore. AND the new control input is not working either.

But all in all, I really want to update the character file format again to automatically include startup and endlag, in addition to just making it a nicer experience to craft a new animation.

It doesn't work because I used the wrong syntax when defining the controls conditions; I'll try again. And the reason we messed up the heavy attack is because I forgot to change the ID on the new state. But I'm still seeing the same problem. I didn't actually fix the ID. Plus I need to actually employ the new interaction type.

When I next resume, I can continue debugging. But it looks like we at least have recovered the heavy attack animation.

## 4/20/2024

5:51 pm - 6:10 pm (19m)
7:55 pm - 10:00 pm (2h5m, 2h24m total)

Debugging the server side of the light kick animation since it doesn't seem to be activating. What happens if I turn off the crouch interaction? I should also see if I can draft up a quicker way to test character controls since spinning up the server is annoying.

If I turn off the crouch interaction, I am able to do the light kick, which is great news! So I'm guessing the problem is that you enter crouch stance as soon as you press the down key and it prevents you from doing the kick. I can resolve this just by letting you do the kick even if you've started a crouch. And that now works! Now I just need to configure the hitbox and we're good.

I've configured the change, but this is a tough process so I'd very much like to switch gears for a moment and configure the logic for destroying a lobby when all players exit. That is best enacted through a change to the Lobby Action API that contacts the Lobby Management API.

But first I need to modify the Lobby Management API to finish up the lobby deletion endpoint. The only remaining problem is that the Lambda lacks permission to the DDB.

I've finished the endpoint--it successfully allowed me to delete a lobby! Now it's time to put some useful print statements for the LAWS change and give it a test.

On first inspection, it does not seem to be deleting the lobby when I leave it. Why is that? Well, the first potential flaw I notice is that we delete the player's entry in the connections database before we get a chance to find out what lobby they're part of. So I should start by moving the deletion to later in the process. I've redeployed with a quick fix that just moves the deletion down.

That also does not result in the destruction of the lobby. Is the endpoint every called? It looks like we are correctly determining that we need deletion, but the request is timing out. So we need to increase the time limit on the Lambda. Simple enough. I increased the timeout to 15 seconds, let's try it.

It still didn't work, so let's take another look at the logs. The LMAPI failed to parse the JSON. The reason detailed [here in StackOverflow](https://stackoverflow.com/questions/26685248/difference-between-data-and-json-parameters-in-python-requests-package) is because if you're using the `data` field you need to specify the content-type header to application/json. So just use the `json` field in `requests.post` instead.

Now it works!

But I realize that I need to redefine the logic for deleting a lobby, because right now it gets deleted even if the players go to the actual game. So really I need to establish a relationship (API) between the lobby and the game server.

But I was wondering if I could simplify this by having the client establish a websocket connection with the lobby even when we're on the game screen. The only problem is that we would momentarily disconnect from the websocket when we switch screens.

The other option is this: When a player hits 'start game', change the lobby status to something like 'in-game'. When players disconnect, check the lobby status, and don't delete the lobby on player disconnects if the status is in-game. Then when the players reconnect to the lobby WS (or better yet, when the game server tells us), set the game status back to 'setting up' or whatever. This won't account for the situation where both players disconnect directly from the game screen... UNLESS we have the game server tell the lobby when this happens. So this is pretty complicated but I think it's the right way to go forward.

The last and most simple option is just to have a button in the lobby itself that deletes the lobby. I like this option because we shouldn't be spending a whole lot of time on complicated lobby deletion logic just yet.

Next time, I want to put together some tools to make it easier to add moves to Ryu's toolkit and test them. But I feel done for now.

## 4/23/2024

9:01 pm - 11:40 pm (2h39m)

As mentioned before, I'll be dedicating some time to constructing more tools for character customization. There are a few features I can list and prioritize:

1. Given a character file, copy-paste it into a page and immediately get to test out the resulting character.
1. Specify a move as a whole instead of separate states for startup, active and end lag

So what's necessary for item (1)?

- A dedicated page on the frontend for it
- Code on the frontend that takes in JSON (string) and comes out with all the animation states for it on the fly
- Code on the backend (an API endpoint) that takes in JSON, consructs a character out of it, and puts the character in a test ring.
- Code in the backend for managing the test ring itself. Should only be active when running locally at the moment.

So, perhaps we can draft up the user experience first. There is a page with a big wide text box where you paste in the character file contents. Next to it is a canvas/viewport for a game, probably without health bars. There is a button for submitting the contents of the textbox. When that button is pressed, we get a loading screen on the canvas, and then it shows a fresh game with a new instance of the character.

This has me excited, so let's go ahead and draft up this page. I think the main challenge will be setting up the debug/tinkering lobby on the backend, but that's fine.

Now we have a nicely styled page--that's the fun part. Later on I would also want to add a piece for putting together animations from a sprite sheet like with the animations tester. But let's just say I want to rapidly test a character. Then what I can do on the frontend is just set up the canvas part of that with stubs for the networked components, including the part where we load animations. So I'll do that now.

It looks like I've already done quite a good job of separating the gamestate from the canvas, so I can actually put a dummy/stub canvas on the page and contrive some made-up state for it and that actually works. Cool!

Now before I go further, let's take a quick moment to see if I can fix up the Canvas element's reluctance to fit nicely in a div. And now it's totally centered, so that's a great sign.

Now, where was I? For the frontend, I wanted to load the animations from a file. I realize now that I need to have two text inputs, one for the frontend character definition and one for the backend. For now I guess I'll focus on the frontend. So the user will put in the character data, hit the submit button, and the canvas will reload with new sprites for the character. Let's do it!

And just like that, I have the system set up to rapidly change the character rendering data and click a single button to re-submit. Nice! Now let's add some kind of system so you can edit both the frontend and backend info. Maybe I'll make a scrollable div containing two text boxes.

Now I'm on the part where I connect this up to the backend. So first let's just ignore the part about sending new character data. We can just focus on establishing a websocket connection like the game does. I think the best thing we can do is make a special 'start-game' debug API endpoint that starts a debug session. But first I want to restart my computer real quick to get rid of this dumb keyboard issue.

Much better! Now let's plan out this debug endpoint. Basically, it should make a game instance immediately with one player that will be piloted by the first person who connects. How will that look in the code?

index.ts will call GameServer.createGameInstance with a list of one player ID specified by the local client. We'll need to pass in a parameter to the game model that lets us skip the regular check for the game being over. Then the client will get back the game ID and use it to connect alongside their spoofed identity ID (or even their real one!). From there we can just establish a normal socket connection.

Now before we get started on that--is it compatible with updating the character definition? How will we even do that? Well, it must start pretty much in index.ts since it's coming from an API call.

When the game creates a character, it calls SimpleCharacterFileReader.readCharacterFile on the data imported directly from the JSON character data file. So we'll need an externally available method that either (1) creates a whole new GameModel or (2) creates a new character from the game data and sticks it in the existing game. I am favoring the latter since that actually reloads the thing we're reloading. So I guess I could focus on adding that capability to GameModel.

When I come back, I'll set up the rest of the server-side endpoint for hosting a debug match and connect it to the character editor.

## 4/27/2024

2:36 pm - 3:00 pm (24 minutes)
5:08 pm - 6:35 pm (1h27m, total )
8:32 pm - 12:33 am (4h1m, total )

As stated above, I'll need to finish implementing the server side endpoint for starting a debug game. What remains? It looks like we mainly just need to pass the debug flag down to the game constructor. So now I've drilled the isDebug prop down to the game model, which means we should no longer be checking for winners, right? So I should probably just not be shy--I'll go ahead and test it.

So the next step is to have the frontend send a signal to create the game and then try to connect. For now I can add some buttons for this.

Awesome! Next I need to connect to the target game with the websocket. We can gather the game ID from the response to the request.

Now I've gotten the game running, but I realize that both this page and Game.tsx need to share all the code for handling incoming and outgoing messages with the server. So I should copy over the code to a portable form and then apply it to Game.tsx.

Now I've made one such candidate for a portable game interface. But I'm not receiving any character updates even though the game should have started. Why is that? Is the game loop running?

The first thing I notice is that the list of expected players is empty when it shouldn't be. And it's because I didn't do a proper job of setting the headers to JSON for the outgoing response. But I fixed that, and now we have the character actually idling around, which is awesome! Does modifying the visualizer still work? Yes, it does indeed! Woo!

Next, I need to make it possible to control the character in this state. That's frontend work on the adapter I made.

And now it just works, which is great! Next I have the following tasks available:

1) Add the endpoint on the backend for creating a character from "Behavior" input text area
2) Add a sprite visualizer that shows the sprites used for the current animation
3) Add controls for pausing
4) Add animation tester

For (1), should it be a socket operation to the game model, or should it be an API request? I think there's no reason for it to be a socket operation in particular, so I'll go ahead and make it an API request--both go through the same interface anyway really.

I set up the new endpoint. It seems to be creating a new character but it doesn't actually give the new character different stats. What's going on? I just had a typo where I forgot to plug in the character data. Fixing that actually fixed the entire thing, so now I can plug in the character on the spot and modify its sprites OR its behavior. That's awesome!

Looking at this, it would be useful to have a placeholder sprite so that we don't crash if I mess with the behavior before I mess with the sprites. And after that I can look at other tools--either the update to the character file format, or the animations visualizer. This feels like a huge step!

So, what do I really want before I implement the next type of attack (probably something from crouch)? I think what I'd like most is that new file format. But here's the flow that I envision for creating the move:

1. Make the frontend part
  1. Just click the place on the sprite sheet, set the height, width, stride, and number of frames.
  2. Check the animation in the animation tester. Maybe at the same time
2. Make the backend part
  1. Define the hitbox and interactions, probably a pretty manual process

So really what excites me the most is setting the animations with just some clicks and having a very visual process of it. So let's pivot toward that and do some playing around.

So let's just put together the mockup for customizing frontend animations. It's got the following:
- Form for specifying file path, frame size, stride, states per frame, center
- Image for selecting offset and visualizing animation
- Animation player (from the animation tester) alongside, to see things in motion.

For that I need to make a special canvas that visualizes the image and lets me at least draw boxes on it to show the frames. Ideally I should be able to zoom and pan but I don't want to spend forever on that.

So I guess I'll be mocking up a UI for that.

Okay, I've made good progress but now I'm very sleepy. When I left off, I had made an editor that lets me view the sprite sheet and highlights the exact parts used to control the animations for each animation. Then I made it so clicking on the sprite sheet could set the offset values. And I tested this with the debug game preview and it seems to have worked! But I'm running into some buggy behavior that I need to figure out where modifying the source data is causing all the state to be reset. So that's for tomorrow.

Next time, I want to add some fields so you can control the other aspects of the animation state such as stride and width using number inputs. Then I want to make it easy to add a new animation state or delete one using the GUI.

Overall, I think this is going to make it much easier to make a character.

## 4/28/2024

11:09 pm - 12:24 am (1h15m)

I realize that I can probably preserve canvas scale on re-render by making it also a prop. This adds a logical problem where the EditorTester owns the canvas sscale when it really shouldn't so that probably just means I need to make a separate component within EditorAnimationView for the canvas. But for now it works so I am not complaining.

Now I'm in a pretty good spot for the character animation editor--it was pretty fun to use it to try put together the front punch animation, but it suffers from the fact that the animations are not evently spaced on the sprite sheet, so I really ought to fix that. In an ideal world, I guess you would be able to specify the frame for each sprite individually, but that probably gets quite complex quickly (?).

Here's what comes next:

1. Make it so that zooming in actually zooms in on where you are selected (or just implement the scrolling thing for real or maybe event zooming in on click), so that I can set precise pixel coordinates for states that aren't in the top left. Requires setting up an offset transformation but that's doable.
2. Add the animation tester somewhere so we can easily play the animation for the current state to see how it's looking.
3. Enable adding or removing animations from the list so that we can actually full define a new animation on the frontend.

I also realize (and this one is a lot more far fetched, but hear me out I guess) that we could make a Python or JS utility that analyzes an image:

- finds all the unique sprites
- groups them into animations
- for each animation, finds the widest and tallest sprites, to make a bounding box
- arranges them all on an output file (or many output files)
- writes the states in my JSON encoding

wow, that would obselete a lot of this work but it would also be extremely cool and exciting! For now I am going to at least get the animation tester together and such so that we can add a new animation.

## 4/29/2024

9:23 pm - 9:46 pm (23m)
11:45 pm - 12:40 pm (55m)

I managed to fix up the issue with re-rendering. The entire problem was that I was using too much layers of function calling when swapping between which component to show between the game and the sprite visualizer.

Now it's time to fix up the zooming in so that it centers on the sprite offset. Let's commit what we have on the editor so far since it's pretty good.

I would say it's now very easy to add an animation state. Just add it in the editor, configure it appropriately, and copy-paste the configuration back into chracterASimple.json. Really nice!

Next, I will add the animation tester to the top, as I promised to myself. It would also be very nice to add some panning around to the editor by switching mouse modes/tools between 'pan' and 'select animation location'. But that's really not necessary. This thing is so cool!

## 4/30/2024

9:05 pm - 10:22 pm (1h17m)
11:23 pm - 11:44 pm (21m, total 1h38m)
11:47 pm - 11:49 pm (2m)
11:51 pm - 12:39 pm (46m, total 2h29m)


I'm starting by adding the animation tester to the animation editor. Let's go for it.

It seems that all I really need to change in the animation tester is having it create a new character visualizer for the animation data whenever it updates, right?

I now have a functional animation tester on the page, which is great! The UI is looking really crowded and ugly, so I might want to take some time to fix that. But for now I have all the tools I need to add some nice animations, so I should probably focus now on the backend aspects of the states so that I at least have something workable.

So how do I even start with that? I have two options:

1) Update the character file parser to take in a new kind of animation state representing an entire attack including startup, active frames, and end lag. Then make the UI define a state of that type.
2) Make the UI conform to the current state, but make it smart by defining one state with startup + active + endlag and then have it translate that into 3 states.

Since (2) would be throwaway work, I'll update the character file parser.

For the new format, I'll add a new optional `type` field on an animation state that lets us define things like movement or attacks. Then I can interpret the type for `state` based on the value of `type`.

To test things out, I'll clobber up the light attack state and transform it into something that translates well.

I think I've got most of the new reader put together. I just am having some problems running the server due to type validation, so next time I'll solve that, debug the new system for reading animation states, and add a UI for defining them.

## 5/1/2024

9:15 pm - 9:17 pm (2m)
9:55 pm - 11:08 pm (1h13m, 1h15m total)
11:22 pm - 12:18 pm (56m, 2h11m total)

I'm getting the new character file reader to compile. Right now it seems that the state I put in characterASimple doesn't count as the FileAttackAnimationDescription type for some reason.

I can probably isolate the problem and solve it by making a quick JSON file just for the value and seeing if it matches the type. The problem is that in the type definition I limited the 'type' value to 'attack' but apparently it's a string according to TS. Strange, but admits an easy fix.

Now it seems that the backend is working fine but we're stuck in the light attack animation. That's probably because we don't have an interaction set for transitioning back to the idle state!

I've added that, but the issue persists. Looking at the network traffic being received by the client (apparently the network tab gives you a good view of that for sockets if you click on the 101 GET request), we seem to have an infinite loop for state lightAttack1. That probably has something to do with lacking a transition to lightAttack(n+1), right?

No, we actually stay on the current animation by default. So it looks like the answer is to set the entire animation to have the afterEnd transition to idle. I'm also in debate about making it so that by default, animations progress to their next index. But it also really doesn't matter, and I shouldn't break anything (probably just the 'knocked out' state).

After some debugging, it would seem the problem is that the lightAttack1 state doesn't have any interactions. Why would that be? It's because I forgot to remove the check that only adds a transition interaction if you are an end frame state!

And now we get a frontend crash that I'm perfectly happy with because it's on lightAttack3! Woo! And using just my editor, I was able to quickly draft up an animation for it (though I once again need to normalize the frame width on the source sprite sheet OR figure out a way to customize frame size per animation frame--I would rather just fix up the sprite sheet).

That's awesome!

Next, I said I wanted to make an editor on the frontend for defining a new attack state and use that to make an actual new attack state. So let's get cracking on that.

When I left off, I was adding controls to the character editor for defining state behavior in the backend like hitboxes and backend frame data. I will continue that so that we have one integrated animation editor.

## 5/3/2024

8:48 pm - 9:05 pm (17m)
9:41 pm - 12:40 pm (2h59m, total 3h16m)

My next objective is to add controls for defining the corresponding backend state when I'm making a frontend state.

This involves a lot of work modifying large objects representing the entire character file definition, so I want to figure out what is the React recommended way of doing that. It looks like there's some React documentation to advise on this: [Updating objects in state](https://react.dev/learn/updating-objects-in-state), [Updating arrays in state](https://react.dev/learn/updating-arrays-in-state).

Apparently there's a cool package called Immer that abstracts a lot of this away, so I kind of want to try that with the behavior state. So let's go ahead and learn!

First I want to do some de-cluttering on the character editor page though. Actually, I'll save that for second. For now I am really interested in meaningfull editing character behavior in the browser!

I didn't really think it was appropriate to mess around with Immer because most of the state changes are taking place in controlled components through props rather than through state.

...But now I realize that I can probably just pass an Immer hook down through the state. Dang, I want to try that but I'm too lazy to refactor. For now I'll just focus on hooking in the rest of the state for editing and making it so you can add a new state too.

I've wired up the general mechanism for making state updates to attack behavior states, which is great. Next I want to visualize the hitboxes in the animation tester.

After some hard work, I'm now successfully rendering collision data with the animation state. Let me just add a toggle in case it gets annoying or I want to scrutinize the animation itself. Done. And I just tested it and can see that the hurtbox adjusts dynamically on the animation tester based on how you set the hitbox. Awesome!

I have all the fields set up now. So let's try making an animation state for the high light kick! Observations:

- I start in paint.net by spacing the sprites evenly in the animation
- In the editor, I start with approximate x and y
- Then I set # of states per frame and # of frames to get the correct number of yellow boxes
- Then I set the stride, then start messing with frame width and offset to get things even
- I focus on the horizontal alignment first, then on the vertical
- I try to get Ryu centered in the frames, and it looks nicer with a little margin
- I need centering too, but I guess I can adjust this in the source for now.

But I'm stopped right there (with the animations done!) because I need to make it so that spawning a new state makes a new Attack state by default! Here's my current params:

- offset x: 454
- offset y: 1085
- frame width: 75
- frame height: 88
- stride: 81
- states per frame: 3
- number of frames: 9

I also notice that I want more startup lag and less end lag, and right now the only way I can do that is by adding more sprites. So maybe I should have some way to directly parameterize startup lag?

For now I've just made it so that the + (new state) button copies the one you are currently on.

Another note: I still need to manually update the flipped sprite sheet too, or else I'll just get null or broken animations. Maybe I can make a Python script for that or something.

And I ran into another problem: If I mess up the source at any point, I lose all my progress. And I need to mess with the source to get the center working. Probably the best solution is to make it so that the source just doesn't try to update anything if it fails to parse the JSON.

Okay, that's squared away. I'm tired, so I'll add the center configuration later.

And now I've successfully added a new attack to Ryu (though without figuring out the controls :p) in less than 10 minutes! This is awesome and it should let me improve the gameplay really quickly! I should commit what I have before I lose something important! Beyond that I'm just awfully tired to continue.

## 5/4/2024

5:00 pm - 5:57 pm (57m)
6:30 pm - 7:30 pm (1h, 57m total)

What can I do now to make it easier to define attack states?

- DONE Allow hiding source code
- Allow defining the key presses to go to the attack (skipping for now)
- DONE Add control for the state to return to (for crouching attacks)
- Panning the canvas
- Add control for animation center
- Ergonomics and layout

Now I'm running into an issue defining character controls where it seems we can't do the low kick in the editor even if I hard code the controls to be moveDown+lightAttack. Why is this? It seems the problem has something to do with the interactions library being undefined for some reason.

The problem was that I accidentally duplicated the ID for the light kick interaction, so it was using the wrong light kick interaction in the wrong place. I fixed it. Glad it wasn't a problem in the code, but I should probably make it throw an error when there's duplicate IDs.

I went ahead and added a light crouching kick so you can poke people while crouching, so that's good.

## 5/5/2024

10:33 am - 11:05 am (32m)
11:22 am - 12:02 pm (40m, total 1h12m)

For the sake of consistent progress, let's add another attack to the character if it's appropriate.

What even is a reasonable set of 'moves' to define a character?

- jab (light directionless attack)
  - can be multi-hit
- heavy jab (heavy directionless attack)
- tilts (light directional attack)
  - down tilt (hits crouching enemy)
  - forward tilt (hits more forward)
  - up tilt (hits enemies in the air)
- heavies (heavy directional attack)
  - up heavy (hits upward)
  - down heavy (hits both sides)
  - forward heavy (strong hit)
- AERIALS
- blocking
- grabs/throws?

I also have this cool idea of making moves modular so that you can have either a roguelike or a Hearthstone Arena aspect where you draft up a character from random moves (some better, some worse) and use it to fight people.

I'm also interested in adding jumping and aerial movement. So I should probably re-configure the movement system to use momentum instead of having player states directly control position all the time. And I should add gravity and a falling state. I guess we can get started on that!

The first thing to do is get rid of the existing movement effect syntax. Instead I want to do movement through unconditional interaction effects involve acceleration.

## 5/6/2024

I was working on adding acceleration. I think I left a note for myself on where I left off. The problem is probably that I'm not actually sourcing the 'acceleration' stat from anywhere. How does the interaction library actually work?

The actual problem is that I was trying to grab the acceleration value from the context of the interaction when in reality I should just be using the value stored in the interaction instance itself.

## 5/7/2024

8:15 pm - 8:46 pm (31m)
9:31 pm - 9:35 pm (4m)
10:44 pm - 10:45 pm (1m)
10:50 pm - 10:52 pm (2m)
10:54 pm - 

I am trying to add jumping and falling to the game. Right now when you jump you accelerate infinitely into the air, which is not what I want. So I'm adding another state, midair, which doesn't apply upward acceleration.

With that comes ground collision. And while I'm tempted to put ground collision's effect on physics in the game code directly instead of defining it using the character file. But I also want to add state transitions that depend on colliding with the ground--mainly that when you are falling and collide with the ground you transition to a landing state.

This makes me realize that I can probably make a separate character class implementing the same interface which hard-codes many of the interactions and is parameterized by a more structured character data file like one that just defines certain parameters about jump states or specific attacks like tilts, smashes (heavies) etc.

Anyway, let's not get away from the goal--when you hit the ground, it should provide a condition signal.

This entire time I was multiplying the y component of acceleration by the directional movement factor. That's what's been causing all this buggy behavior where we sometimes go down and sometimes up!

I also see no reason to cap the player's vertical velocity, so I removed that. Next, I can work on allowing the player to move around in the air, and then maybe I can try adding an attack in the air!

## 5/11/2024

Last time I was working on adding midair movement. But I have a problem where the movement pipeline always multiplies movement by the direction factor, so when I have the character move in negative X direction when pressing moveLeft, we actually move right if we're facing left. So what's the solution? I should add an option to the definition for an acceleration effect that lets you ignore direction.

That would involve modifying the movement pipeline so that we can parameterize the direction effect on movement. But that should be doable--it just requires me to parameterize whether to involve direction.

I can probably add a method to get player direction and then use that to apply the sign for the acceleration. And sure enough, it worked! Now let's add the movement for the other direction, and then let's also add a transition from running to jumping.

And now I've added both those things, and it was actually very simple and totally without code changes. Pretty cool.

Next time, I should add a Nair attack so that attacking isn't useless. After that, if I just add a shield and a grab, I think I'll actually have a pretty interesting set of moves, which bodes well for the gameplay.

But for now I want to take a pivot and learn about dedicated game development tools like Godot, since I'll want something like that for the game jams.

## 7/6/2024

10:00 pm - 10:44 pm

Let's add a Nair. Do I have a good animation to use for it? Let's see.

## 7/10/2024

I've now added a Nair that transitions to and from the midair state and obeys gravity. Next, I can make a landing lag state when you hit the ground while nairing. After that I want to look into dodging, rolling and grabbing. And after that I can do a shield state.