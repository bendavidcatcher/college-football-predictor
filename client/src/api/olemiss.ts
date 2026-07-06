import { apiRequest } from './client';
import type { OleMissDashboard } from '../types';

export function getOleMissDashboard(): Promise<OleMissDashboard> {
  return apiRequest<OleMissDashboard>('/olemiss/dashboard');
}
