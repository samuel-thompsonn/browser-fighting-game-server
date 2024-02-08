# Lobby Management API

## Description

CRUD API for lobbies. Allows users to list out all lobbies, create lobbies.

## Data model

In the DDB backend, the following constitutes a lobby:
- ID: String (UUID)
- Name: String
- *Owner (User): String (User ID)
- Max player capacity
- Status: Enum (active, in-game, closed)
- Number of players in the lobby?
- *List of players in the lobby?
- *Time opened
- *Time last updated (to allow closing lobby on inactivity)
- *pointer to active game, if active
    - maybe could allow routing users to spectate?