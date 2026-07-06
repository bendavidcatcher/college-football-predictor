import { Router } from 'express';
import * as oleMissController from '../controllers/olemiss.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const oleMissRouter = Router();

oleMissRouter.get('/dashboard', asyncHandler(oleMissController.dashboard));
