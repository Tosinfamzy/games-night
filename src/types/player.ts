import { BasePlayer, BaseSession, BaseTeam } from "./base";

export interface CreatePlayerDto {
  name: string;
  type?: string;
}

export interface Player extends BasePlayer {
  session: BaseSession;
  team?: BaseTeam;
}
