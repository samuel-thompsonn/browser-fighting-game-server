import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import dotenv from 'dotenv';
import ClientHandler from './ClientHandler';
import GameModel from './GameModel';
import { ControlsChange } from './AnimationUtil';
import GameInstance from './GameInstance';
import GameListener from './GameListener';

dotenv.config();
const { NODE_ENV, PORT, CLIENT_URL } = process.env;
const VERBOSE = NODE_ENV !== 'production';
const GAME_LOOPS_PER_SECOND = 30;
const SECONDS_PER_GAME_LOOP = 1 / GAME_LOOPS_PER_SECOND;
const MILLIS_PER_GAME_LOOP = SECONDS_PER_GAME_LOOP * 1000;
const MILLIS_FOR_GAME_START = 3000;

// List of players that we expecct to join the game.
// TODO: Get this information from a database/API.
const PLAYERS = ['Player 1 Name', 'Player 2 Name'];

function logVerbose(logText:string) {
  if (VERBOSE) { console.log(logText); } // eslint-disable-line
}

const clientHandlers: GameListener[] = [];

interface GameInstanceData {
  gameInstance: GameInstance
  gameInterval: NodeJS.Timer | undefined
}

const gameInstances = new Map<number, GameInstanceData>();

function updateGame(gameInstance: GameInstance) {
  gameInstance.updateGame(SECONDS_PER_GAME_LOOP);
}

function onGameComplete(winnerID: string) {
  clientHandlers.forEach((clientHandler) => {
    clientHandler.handleGameComplete(winnerID);
  });
}

function onGameStarted(gameInstance: GameInstance) {
  logVerbose(`All players are now connected. Starting game in ${MILLIS_FOR_GAME_START} millis.`);
  const gameInstanceData = gameInstances.get(0);
  if (gameInstanceData === undefined) {
    throw new Error('Target game instance not found');
  }
  setTimeout(() => {
    console.log('Starting the game simulation.');
    gameInstanceData.gameInterval = setInterval(
      () => updateGame(gameInstance),
      MILLIS_PER_GAME_LOOP,
    );
  }, MILLIS_FOR_GAME_START);
  const gameStartTime = new Date(new Date().getTime() + MILLIS_FOR_GAME_START);
  clientHandlers.forEach((clientHandler) => clientHandler.handleGameStart(gameStartTime));
}

function onGameTerminated(gameInstance: GameInstance) {
  clearInterval(gameInstances.get(gameInstance.getID())?.gameInterval);
}

function initializeGameModel(): GameInstance {
  // const gameID = Math.floor(Math.random() * 10000000);
  if (gameInstances.size > 0) {
    throw new Error('A game instance already exists; we cannot support more than 1 at the moment');
  }
  const gameID = 0;
  const gameModel = new GameModel(
    gameID,
    PLAYERS.length,
    onGameStarted,
    onGameComplete,
    onGameTerminated,
  );
  gameInstances.set(gameID, { gameInstance: gameModel, gameInterval: undefined });
  return gameModel;
}

initializeGameModel();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

function handleCreateCharacter() {
  logVerbose('Received signal to create a character!');
  const gameInstance = gameInstances.get(0)?.gameInstance;
  if (gameInstance === undefined) {
    throw new Error('Target game instance was not found!');
  }
  return gameInstance.createCharacter();
}

function handleReset() {
  const gameInstanceData = gameInstances.get(0);
  if (gameInstanceData === undefined) {
    throw new Error('Game instance was not found!');
  }
  gameInstances.delete(0);
  clientHandlers.forEach((clientHandler) => {
    gameInstanceData.gameInstance.removeCharacterListener(clientHandler);
    clientHandler.clearCharacterID();
    clientHandler.handleReset();
  });
  clearInterval(gameInstanceData.gameInterval);
  const newGameModel = initializeGameModel();
  clientHandlers.forEach((clientHandler) => {
    newGameModel.addGameListener(clientHandler);
  });
  logVerbose('Reset the game!');
}

function handleClientControlsChange(characterID:string, controlsChange:ControlsChange) {
  const gameInstance = gameInstances.get(0)?.gameInstance;
  if (gameInstance === undefined) {
    throw new Error('Target game instance was not found!');
  }
  gameInstance.updateCharacterControls(characterID, controlsChange);
}

const handleClientDisconnect = (client: ClientHandler): void => {
  logVerbose('a user disconnected.');
  const targetIndex = clientHandlers.indexOf(client);
  if (targetIndex !== -1) {
    clientHandlers.splice(clientHandlers.indexOf(client), 1);
    logVerbose('Removed user from user list.');
    logVerbose(`There are ${clientHandlers.length} users remaining.`);
  }
  const gameInstance = gameInstances.get(0)?.gameInstance;
  if (gameInstance === undefined) {
    throw new Error('Target game instance was not found!');
  }
  gameInstance.removeCharacterListener(client);
  const removedCharacter = client.getCharacterID();
  if (removedCharacter) { gameInstance.removeCharacter(removedCharacter); }
};

// I could pass io into a client handler factory to basically
// encapsulate all websocket behavior.
io.on('connection', (socket) => {
  const gameInstance = gameInstances.get(0)?.gameInstance;
  if (gameInstance === undefined) {
    throw new Error('Target game instance was not found!');
  }
  logVerbose('a user connected!');
  const newClient = new ClientHandler(
    socket,
    handleClientControlsChange,
    handleClientDisconnect,
    handleCreateCharacter,
    handleReset,
  );
  clientHandlers.push(newClient);
  logVerbose(`There are now ${clientHandlers.length} users connected.`);
  gameInstance.addGameListener(newClient);
  newClient.acceptConnection();
});

app.use(express.static(path.resolve(__dirname, '../public')));

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
