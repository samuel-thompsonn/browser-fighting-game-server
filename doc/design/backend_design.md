# Backend Design

## Lobbies

Lobbies will need to be stored in some persistent data store keeping track of all existing lobbies. The lifecycle of a lobby can involve either their status being changed to "EXPIRED/CLOSED" or they can cease to exit in the DB; I prefer the idea of persisting them since it allows better inspection--but it also poses a security risk where I will need to defend myself from spamming lobbies. That is fine!

## Games

The hosting game server will be decoupled from the client in order to be dynamic. Therefore we need some way to tell the client which server to attempt to connect to, in order to have some kind of sticky session. One way to do this is to have the server respond to a "Start Game" call with a hostname, or with a game ID that can be used by a later page to ask for a backend from a separate endpoint.

