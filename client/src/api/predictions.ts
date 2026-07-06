import { apiRequest } from './client';
import type { PredictionResult, SavedPrediction } from '../types';

export interface CreatePredictionInput {
  teamAId: number;
  teamBId: number;
  homeTeamId: number | null;
}

export function createPrediction(input: CreatePredictionInput): Promise<PredictionResult> {
  return apiRequest<PredictionResult>('/predictions', {
    method: 'POST',
    body: input,
  });
}

export function savePrediction(predictionId: number): Promise<SavedPrediction> {
  return apiRequest<SavedPrediction>('/predictions/save', {
    method: 'POST',
    body: { predictionId },
    auth: true,
  });
}

export function getSavedPredictions(): Promise<SavedPrediction[]> {
  return apiRequest<SavedPrediction[]>('/predictions/saved', {
    method: 'GET',
    auth: true,
  });
}

export function deleteSavedPrediction(id: number): Promise<void> {
  return apiRequest<void>(`/predictions/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
