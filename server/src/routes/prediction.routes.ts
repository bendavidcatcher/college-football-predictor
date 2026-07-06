import { Router } from 'express';
import * as predictionController from '../controllers/prediction.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const predictionRouter = Router();

predictionRouter.post('/', asyncHandler(predictionController.createPrediction));
predictionRouter.post('/save', requireAuth, asyncHandler(predictionController.savePrediction));
predictionRouter.get('/saved', requireAuth, asyncHandler(predictionController.listSaved));
predictionRouter.delete('/:id', requireAuth, asyncHandler(predictionController.deleteSaved));
