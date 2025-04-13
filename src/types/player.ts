import { BasePlayer, BaseSession, BaseTeam } from "./base";

export interface CreatePlayerDto {
  name: string;
  sessionId: string;
  type?: string;
}

export interface Player extends BasePlayer {
  session: BaseSession;
  team?: BaseTeam;
}
