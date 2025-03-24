import { BaseTeam, BasePlayer } from "./base";

export interface Team extends BaseTeam {
  players: BasePlayer[];
}
