import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
// For some reason the below line has a linter error for not
// listing socket.io-client in the dependencies, even though
// it's in package.json.
// eslint-disable-next-line import/no-extraneous-dependencies
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { Server, Socket as ServerSocket } from 'socket.io';

function waitFor(socket: ServerSocket | ClientSocket, event: string) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

describe('my awesome project', () => {
  let serverSocket: ServerSocket;
  let clientSocket: ClientSocket;
  let io: Server;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const { port } = (httpServer.address() as AddressInfo);
      clientSocket = ioc(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.disconnect();
  });

  test('should work', (done) => {
    clientSocket.on('hello', (arg) => {
      expect(arg).toBe('world');
      done();
    });
    serverSocket.emit('hello', 'world');
  });

  test('should work with an acknowledgement', (done) => {
    serverSocket.on('hi', (cb) => {
      cb('hola');
    });
    clientSocket.emit('hi', (arg: string) => {
      expect(arg).toBe('hola');
      done();
    });
  });

  test('should work with emitWithAck()', async () => {
    serverSocket.on('foo', (cb) => {
      cb('bar');
    });
    const result = await clientSocket.emitWithAck('foo');
    expect(result).toBe('bar');
  });

  test('should work with waitFor()', () => {
    clientSocket.emit('baz');

    return waitFor(serverSocket, 'baz');
  });
});
