// For some reason the below line has a linter error for not
// listing socket.io-client in the dependencies, even though
// it's in package.json.
// eslint-disable-next-line import/no-extraneous-dependencies
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
// eslint-disable-next-line import/no-extraneous-dependencies
import fetch from 'node-fetch';
import { Socket as ServerSocket, Socket } from 'socket.io';
import { GameID } from '../GameInterfaces';

function waitFor(socket: ServerSocket | ClientSocket, event: string) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

interface GameStartResponse {
  gameID: string;
}

interface Client {
  playerID: string;
  socket: ClientSocket;
}

const SERVER_PORT = 3001;
// const MOCK_PLAYER_ID = 'PlayerID1';

describe('Browser fighting game server', () => {
  const callStartGame = async (playerIDs: string[]) => {
    const requestBody = { players: playerIDs };
    const startGameResponse = await fetch('http://localhost:3001/start-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    return ((await startGameResponse.json()) as GameStartResponse).gameID;
  };

  describe('two-player game', () => {
    const playerIDs = ['PlayerID1', 'PlayerID2'];
    let twoPlayerGameID: string;
    let clients: Client[];
    let characterStartingX: number;
    afterAll(() => {
      clients.forEach(({ socket }) => socket.disconnect());
    });
    it('succeeds in starting two-player game', (done) => {
      callStartGame(playerIDs).then((newGameID) => {
        twoPlayerGameID = newGameID;
        done();
      });
    });
    it('sends startGame message when all players connect and identify themselves', (done) => {
      clients = playerIDs.map((playerID) => ({
        playerID,
        socket: ioc(`http://localhost:${SERVER_PORT}`),
      }));
      const clientsReceiveStartGame = clients.map((client) => new Promise((resolve) => {
        client.socket.on('startGame', () => {
          resolve({});
        });
      }));
      Promise.all(clientsReceiveStartGame).then(() => done());
      clients.forEach((client) => {
        client.socket.emit('sendIdentity', { playerID: client.playerID });
        client.socket.emit('joinGame', { playerID: client.playerID, gameID: twoPlayerGameID });
      });
    });
    it('sends game updates to all players when game starts', (done) => {
      const clientsReceiveStatusUpdate = clients.map((client) => new Promise((resolve) => {
        // client.socket.on('updateCharacter', ({ data: { id, position: { x } } }) => {
        client.socket.on('updateCharacter', ({ id, position: { x } }) => {
          if (id === playerIDs[0]) {
            if (characterStartingX === undefined) {
              characterStartingX = x;
            }
            resolve({});
          }
        });
      }));
      Promise.all(clientsReceiveStatusUpdate).then(() => done());
    });
    it('accepts player inputs to affect gamestate', (done) => {
      const controlsChange = { control: 'moveRight', status: 'pressed' };
      clients[0].socket.emit('controlsChange', { controlsChange });
      const clientsReceiveDifferentGameState = clients.map((client) => new Promise((resolve) => {
        client.socket.on('updateCharacter', ({ id, position: { x } }) => {
          if (id === playerIDs[0] && x !== characterStartingX) {
            resolve({});
          }
        });
      }));
      Promise.all(clientsReceiveDifferentGameState).then(() => done());
    });
    it('sends signals for game complete when a player wins.', (done) => {
      clients[0].socket.emit('forfeitGame');
      const clientsReceiveGameComplete = clients.map((client) => new Promise((resolve) => {
        client.socket.on('gameComplete', ({ winnerID }) => {
          expect(winnerID).toEqual(clients[1].playerID);
          resolve({});
        });
      }));
      Promise.all(clientsReceiveGameComplete).then(() => done());
    });
  });

  // TODO: Add test case for receiving updates from the server about game state
  // TODO: Add test case for server reciving controls updates and having this modify game state

  // TODO: Add a debug util for forfeiting so that we can get the full game end-to-end flow.
  // it('succeeds in sending signals for end of game and terminating connection when game complete')
});
