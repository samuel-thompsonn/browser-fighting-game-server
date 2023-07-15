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
- Make knockback from attacks take you in the correct direction / put you in the right knockback state
- Fix up the animation for getting knocked out
- Fix up the hitbox for heavy attack
- Simplify file definitions of attack animations to include startup & end lag
- Fix up the hurtbox for Ryu
- Fix up knocked back animation to separate out the sprites more