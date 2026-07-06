import { Router } from 'express';
import { authRouter } from './auth.routes';
import { teamRouter } from './team.routes';
import { predictionRouter } from './prediction.routes';
import { oleMissRouter } from './olemiss.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/teams', teamRouter);
apiRouter.use('/predictions', predictionRouter);
apiRouter.use('/olemiss', oleMissRouter);
