# Browser Fighting Game

Author: Sam Thompson

This is an attempt at making an in-browser fighting game where you play as customizable data-driven characters whose sprites and interactions with other entities are determined by JSON files. The eventual goal is that you can create your own character data file and play with it online.

## How to run it

```
npm run start
```

## How to debug it

In VSCode, just go to index.ts and run the Node.js debugger with F5.

## How to run integration tests

In terminal 1, start the server:

```
npm run start
```

In terminal 2, run the integration tests:

```
npm run test -- test_server_direct.test.ts
```
