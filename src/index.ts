import express, { Express } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import dotenv from 'dotenv';
import SocketAPIImpl from './socket_api/SocketAPIImpl';
import GameServerImpl from './game_server/GameServerImpl';
import GameServer from './game_server/GameServer';

dotenv.config();
const { NODE_ENV, PORT, CLIENT_URL } = process.env;
const VERBOSE = NODE_ENV !== 'production';

function logVerbose(logText:string) {
  if (VERBOSE) { console.log(logText); } // eslint-disable-line
}

// function createGameInstance(expectedPlayerIdentities: string[]) {
//   const gameInstanceManager = new GameInstanceManagerImpl(
//     expectedPlayerIdentities,
//     MILLIS_FOR_GAME_START,
//     SECONDS_PER_GAME_LOOP,
//   );
//   const gameID = gameInstanceManager.getGameID();
//   gameInstances.set(gameID, gameInstanceManager);
// }

// Handles a request from the Lobby Action API to start a game instance
function setUpStartGameEndpoint(app: Express, gameServer: GameServer) {
  app.post('/start-game', (req, res) => {
    const { players = [] } = req.body;
    console.log(`Received an HTTP request, POST to /start-game. req.body: ${JSON.stringify(req.body)}. players.length: ${players.length}`);
    console.log(`Received an HTTP POST request to /start-game. List of players: ${players}`);
    // TODO: Authenticate players if they are authenticated users
    const gameID = gameServer.createGameInstance(players);
    console.log(`Sending response to startGame. gameID=${gameID}`);
    res.json({
      gameID,
    });
  });
}

function main() {
  const app = express();
  app.use(express.static(path.resolve(__dirname, '../public')));
  app.use(express.json());
  const socketServer = new SocketAPIImpl();
  const gameServer: GameServer = new GameServerImpl(socketServer);
  setUpStartGameEndpoint(app, gameServer);

  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  socketServer.configureServer(io, gameServer);

  app.get('*', (req, res) => {
    logVerbose('Received an HTTP GET request for a page!');
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
  });

  server.listen(PORT, () => {
    console.log(`NODE_ENV environmental variable value: ${process.env.NODE_ENV}.`);
    console.log(`Running in ${NODE_ENV} mode.`);
    console.log(`Listening on port ${PORT}.`);
    console.log(`Allowed origin URL for client: ${CLIENT_URL}`);
  });
}

main();

// function handleCreateCharacter() {
//   // TODO: This should be handled by game instance managers
//   logVerbose('Received signal to create a character!');
//   const gameInstance = gameInstances.get(0)?.gameInstance;
//   if (gameInstance === undefined) {
//     throw new Error('Target game instance was not found!');
//   }
//   return gameInstance.createCharacter();
// }

// function handleClientControlsChange(characterID:string, controlsChange:ControlsChange) {
//   // TODO: This should be handled by game instance managers
//   const gameInstance = gameInstances.get(0)?.gameInstance;
//   if (gameInstance === undefined) {
//     throw new Error('Target game instance was not found!');
//   }
//   gameInstance.updateCharacterControls(characterID, controlsChange);
// }

// const handleClientDisconnect = (client: ClientHandler): void => {
//   // TODO: This should be handled by game instance managers
//   logVerbose('a user disconnected.');
//   const targetIndex = clientHandlers.indexOf(client);
//   if (targetIndex !== -1) {
//     clientHandlers.splice(clientHandlers.indexOf(client), 1);
//     logVerbose('Removed user from user list.');
//     logVerbose(`There are ${clientHandlers.length} users remaining.`);
//   }
//   const gameInstance = gameInstances.get(0)?.gameInstance;
//   if (gameInstance === undefined) {
//     throw new Error('Target game instance was not found!');
//   }
//   gameInstance.removeCharacterListener(client);
//   const removedCharacter = client.getCharacterID();
//   if (removedCharacter) { gameInstance.removeCharacter(removedCharacter); }
// };

// app.get('*', (req, res) => {
//   logVerbose('Received an HTTP GET request for a page!');
//   res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
// });
