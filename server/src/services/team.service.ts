import { Game, Team, TeamSeasonStats } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { GameDto, TeamDto, TeamStatsDto } from '../types/api';

/** The season the seeded demo data represents. */
export const CURRENT_SEASON = 2025;

type TeamWithStats = Team & { seasonStats: TeamSeasonStats[] };
type GameWithTeams = Game & { homeTeam: Team; awayTeam: Team };

export function toTeamDto(team: TeamWithStats): TeamDto {
  const stats = team.seasonStats.find((s) => s.season === CURRENT_SEASON) ?? null;
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    mascot: team.mascot,
    conference: team.conference,
    city: team.city,
    state: team.state,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    stats: stats ? toStatsDto(stats) : null,
  };
}

function toStatsDto(stats: TeamSeasonStats): TeamStatsDto {
  return {
    season: stats.season,
    wins: stats.wins,
    losses: stats.losses,
    conferenceWins: stats.conferenceWins,
    conferenceLosses: stats.conferenceLosses,
    pointsPerGame: stats.pointsPerGame,
    pointsAllowedPerGame: stats.pointsAllowedPerGame,
    yardsPerGame: stats.yardsPerGame,
    yardsAllowedPerGame: stats.yardsAllowedPerGame,
    turnoverMargin: stats.turnoverMargin,
    strengthOfSchedule: stats.strengthOfSchedule,
    recentFormScore: stats.recentFormScore,
  };
}

export function toGameDto(game: GameWithTeams): GameDto {
  return {
    id: game.id,
    season: game.season,
    week: game.week,
    date: game.date.toISOString(),
    status: game.status,
    isConferenceGame: game.isConferenceGame,
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
      primaryColor: game.homeTeam.primaryColor,
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
      primaryColor: game.awayTeam.primaryColor,
    },
    homeScore: game.homeScore,
    awayScore: game.awayScore,
  };
}

export async function getAllTeams(): Promise<TeamDto[]> {
  const teams = await prisma.team.findMany({
    include: { seasonStats: true },
    orderBy: { name: 'asc' },
  });
  return teams.map(toTeamDto);
}

export async function getTeamById(id: number): Promise<TeamDto> {
  const team = await prisma.team.findUnique({
    where: { id },
    include: { seasonStats: true },
  });
  if (!team) throw ApiError.notFound('Team not found');
  return toTeamDto(team);
}

export async function getTeamGames(teamId: number): Promise<GameDto[]> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw ApiError.notFound('Team not found');

  const games = await prisma.game.findMany({
    where: {
      season: CURRENT_SEASON,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { week: 'asc' },
  });
  return games.map(toGameDto);
}
