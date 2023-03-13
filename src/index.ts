import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import ClientHandler from './ClientHandler';
import GameModel from './GameModel';
import dotenv from 'dotenv';

dotenv.config();
const ENVIRONMENT_TYPE = process.env.NODE_ENV == "production"?
  "production" :
  "development";
const PORT = ENVIRONMENT_TYPE == "production"?
  process.env.PORT_PRODUCTION :
  process.env.PORT_DEVELOPMENT;
const CORS_CLIENT_URL = ENVIRONMENT_TYPE == "production"?
  process.env.CLIENT_URL_PRODUCTION :
  process.env.CLIENT_URL_DEVELOPMENT;
const SECONDS_PER_GAME_LOOP = 0.0333;

const clientHandlers = new Map<string, ClientHandler>();
const gameModel = new GameModel();
let socketCounter = 0;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const VERBOSE = true;

function logVerbose(logText:string) {
  if (VERBOSE) { console.log(logText); } // eslint-disable-line
}

const handleCreateCharacter = (client:ClientHandler) => {
  const characterID = gameModel.createCharacter();
  client.setCharacterID(characterID);
};

const handleClientDisconnect = (client: ClientHandler): void => {
  logVerbose('a user disconnected....!');
  gameModel.removeCharacterListener(client);
  const removedCharacter = client.getCharacterID();
  if (removedCharacter) { gameModel.removeCharacter(removedCharacter); }
};

io.on('connection', (socket) => {
  logVerbose('a user connected!');
  const newClient = new ClientHandler(
    socket,
    gameModel,
    handleClientDisconnect,
  );
  clientHandlers.set(`${socketCounter}`, newClient);
  gameModel.addCharacterListener(newClient);
  // logVerbose(clientHandlers.toString());
  socketCounter += 1;
  socket.emit('accepted_connection');

  socket.on('createCharacter', () => {
    handleCreateCharacter(newClient);
  });
});

app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get('*', (req, res) => {
  logVerbose('Received an HTTP GET request for a page!');
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

// let ellipsisCount = 1;
// const maxEllipsis = 3;
// We can use the return value of setInterval() to get
// an interval object which we can reference later to pause or modify
// the game loop's pacing
setInterval(() => {
  // ellipsisCount %= (maxEllipsis + 1);
  // const ellipsis = '.'.repeat(ellipsisCount) + ' '.repeat(maxEllipsis - ellipsisCount);
  // process.stdout.write(`\rUpdating all characters${ellipsis}`);
  // ellipsisCount += 1;
  gameModel.updateGame(SECONDS_PER_GAME_LOOP);
}, 1000 * SECONDS_PER_GAME_LOOP);

server.listen(PORT, () => {
  logVerbose(`NODE_ENV environmental variable value: ${process.env.NODE_ENV}.`);
  logVerbose(`Running in ${ENVIRONMENT_TYPE} mode.`);
  logVerbose(`Listening on port ${PORT}.`);
  logVerbose(`Allowed origin URL for client: ${CORS_CLIENT_URL}`);
});
