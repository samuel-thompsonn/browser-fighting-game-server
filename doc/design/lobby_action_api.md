# Lobby Action API

## Description

Draft date: 9/4/2023

Used to communicate actions by members of a lobby. Currently, the actions are (1) switching characters, and (2) readying up. Since there's only one character right now, we'll start with readying up.

The API is backed up by a DDB table which keeps track of the live status of players in each lobby, so that the persisted state can be communicated to any players that join. It essentially acts as a chat API, since all events are driven as a direct response to user input, rather than anything taking place asynchronously on the server side such as frame-based updates.

## Examples

Sam joins lobby `e75437c6-3fe2-4164-bb7c-f81c763a469a`, which has Annie as a player. He sends a connection request to the Lobby Action websocket API, which sends him Annie's current state:

```
{
    "player": "Annie",
    "ready": false,
    "character": "Ryu"
}
```

(It's possible that these strings could be swapped for IDs/lookup keys for the player and character.)

Sam then readies up. He sends an update to the API with his new state on channel "updateStatus":

```
{
    "player": "Sam",
    "ready": true,
    "character": "Ryu"
}
```

The API then broadcasts this exact message to all other clients. Judging by this terrible Free Code Camp blog (https://www.freecodecamp.org/news/real-time-applications-using-websockets-with-aws-api-gateway-and-lambda-a5bb493e9452/), the JSON in the request is actually a string that gets parsed as JSON, and we parse `event` as JSON and extract the fields from there. Good to know!

Also, I wonder how to make unit and integration tests for Lambda.

When I left off, I was still not able to make a Lambda send a message to a client connection, as the message was being eaten without error, but the client did receive anything. What's going wrong?
