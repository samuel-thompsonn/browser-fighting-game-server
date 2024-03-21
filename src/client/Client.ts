export type PlayerID = string;

interface Client {
  getPlayerID: () => PlayerID;
}

export default Client;
