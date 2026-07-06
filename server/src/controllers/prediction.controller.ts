import { Request, Response } from 'express';
import * as predictionService from '../services/prediction.service';
import { AuthenticatedRequest, getUserId } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';
import { parseId } from './team.controller';

export async function createPrediction(req: Request, res: Response) {
  const { teamAId, teamBId, homeTeamId } = req.body ?? {};
  if (!Number.isInteger(teamAId) || !Number.isInteger(teamBId)) {
    throw ApiError.badRequest('teamAId and teamBId are required integers');
  }
  if (homeTeamId !== null && homeTeamId !== undefined && !Number.isInteger(homeTeamId)) {
    throw ApiError.badRequest('homeTeamId must be an integer or null');
  }
  const result = await predictionService.createPrediction(teamAId, teamBId, homeTeamId ?? null);
  res.status(201).json(result);
}

export async function savePrediction(req: AuthenticatedRequest, res: Response) {
  const { predictionId } = req.body ?? {};
  if (!Number.isInteger(predictionId)) {
    throw ApiError.badRequest('predictionId is required');
  }
  const saved = await predictionService.savePrediction(getUserId(req), predictionId);
  res.status(201).json(saved);
}

export async function listSaved(req: AuthenticatedRequest, res: Response) {
  res.json(await predictionService.getSavedPredictions(getUserId(req)));
}

export async function deleteSaved(req: AuthenticatedRequest, res: Response) {
  await predictionService.deleteSavedPrediction(
    getUserId(req),
    parseId(req.params.id, 'saved prediction id')
  );
  res.status(204).send();
}
