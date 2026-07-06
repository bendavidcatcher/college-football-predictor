/**
 * Response shapes shared with the client. Keep in sync with client/src/types.
 */

export interface TeamStatsDto {
  season: number;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  yardsPerGame: number;
  yardsAllowedPerGame: number;
  turnoverMargin: number;
  strengthOfSchedule: number;
  recentFormScore: number;
}

export interface TeamDto {
  id: number;
  name: string;
  abbreviation: string;
  mascot: string;
  conference: string;
  city: string;
  state: string;
  primaryColor: string;
  secondaryColor: string;
  stats: TeamStatsDto | null;
}

export interface GameTeamDto {
  id: number;
  name: string;
  abbreviation: string;
  primaryColor: string;
}

export interface GameDto {
  id: number;
  season: number;
  week: number;
  date: string;
  status: 'FINAL' | 'SCHEDULED';
  isConferenceGame: boolean;
  homeTeam: GameTeamDto;
  awayTeam: GameTeamDto;
  homeScore: number | null;
  awayScore: number | null;
}

export interface PredictionFactorDto {
  category: string;
  teamAValue: number;
  teamBValue: number;
  edge: 'A' | 'B' | 'EVEN';
  description: string;
}

export interface PredictionResultDto {
  id: number | null;
  teamA: TeamDto;
  teamB: TeamDto;
  homeTeamId: number | null;
  winnerTeamId: number;
  teamAWinProbability: number;
  teamBWinProbability: number;
  projectedScoreA: number;
  projectedScoreB: number;
  factors: PredictionFactorDto[];
  summary: string;
}

export interface SavedPredictionDto {
  id: number;
  createdAt: string;
  prediction: PredictionResultDto;
}

export interface AuthUserDto {
  id: number;
  email: string;
  name: string;
}

export interface WeeklyPerformanceDto {
  week: number;
  opponent: string;
  pointsFor: number;
  pointsAgainst: number;
  result: 'W' | 'L';
}

export interface OleMissDashboardDto {
  team: TeamDto;
  games: GameDto[];
  nextGame: GameDto | null;
  nextGamePrediction: PredictionResultDto | null;
  weeklyPerformance: WeeklyPerformanceDto[];
}
