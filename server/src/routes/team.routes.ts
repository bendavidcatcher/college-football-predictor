import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const teamRouter = Router();

teamRouter.get('/', asyncHandler(teamController.listTeams));
teamRouter.get('/:id', asyncHandler(teamController.getTeam));
teamRouter.get('/:id/games', asyncHandler(teamController.getTeamGames));
