import { Request, Response } from 'express';
import * as oleMissService from '../services/olemiss.service';

export async function dashboard(_req: Request, res: Response) {
  res.json(await oleMissService.getOleMissDashboard());
}
