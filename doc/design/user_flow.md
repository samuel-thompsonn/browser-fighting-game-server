# User Flow

## Title screen

- Contains title
- Contains credits
- Press "Find Lobby" button: go to lobby selection

## Lobby selector

- Contains list of all active public lobbies
    - P0: All lobbies are public
- Press "Back" button: Go to title screen
- Press "Join" button on any lobby: Go to lobby screen for selected lobby
- Press "Create lobby" button: Go to lobby creation prompt

## Lobby creation prompt

- Allows entering lobby settings
    - P0: Lobby name
    - P1: Max players, private, allowed characters etc.
- Press "Back" button: Go to lobby selector
- Press "Create" button: Create lobby OR give some notification if form validation fails

## Lobby

- Allows selecting character
- P1: Allows selecting stage
- Shows lobby name and current lobby members list
- Allows toggling readiness status: You may ready up when you have selected a character
- Allows starting the game when the all members have readied up

## Game

- Allows controlling your character to fight
- Allows forfeit, and has forfeit upon disconnect
    - P1: Attempt to reconnect
- When match is complete, allows exit back to lobby with a button
