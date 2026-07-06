import { Request, Response } from 'express';
import * as teamService from '../services/team.service';
import { ApiError } from '../utils/ApiError';

export function parseId(raw: string, label = 'id'): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
  return id;
}

export async function listTeams(_req: Request, res: Response) {
  res.json(await teamService.getAllTeams());
}

export async function getTeam(req: Request, res: Response) {
  res.json(await teamService.getTeamById(parseId(req.params.id, 'team id')));
}

export async function getTeamGames(req: Request, res: Response) {
  res.json(await teamService.getTeamGames(parseId(req.params.id, 'team id')));
}
