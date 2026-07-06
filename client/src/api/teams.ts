import { apiRequest } from './client';
import type { Team, Game } from '../types';

export function getTeams(): Promise<Team[]> {
  return apiRequest<Team[]>('/teams');
}

export function getTeam(id: number | string): Promise<Team> {
  return apiRequest<Team>(`/teams/${id}`);
}

export function getTeamGames(id: number | string): Promise<Game[]> {
  return apiRequest<Game[]>(`/teams/${id}/games`);
}
