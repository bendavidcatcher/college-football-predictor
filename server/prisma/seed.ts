/**
 * Seeds the database with realistic DEMO data for the 2025 season:
 *   - 10 SEC teams with hand-tuned quality ratings
 *   - a 9-round round-robin schedule (weeks 1-8 played, week 9 upcoming,
 *     arranged so the Egg Bowl — Ole Miss vs Mississippi State — is the
 *     upcoming game on the Ole Miss dashboard)
 *   - per-team season stats derived from the generated results so records,
 *     points per game, and recent form are all internally consistent
 *   - a demo user account (demo@cfb.dev / password123)
 *
 * Results are generated with a seeded LCG so the same data is produced on
 * every run. This is sample data for the MVP; swap this file for a real
 * sports data source later.
 */

import { PrismaClient, GameStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEASON = 2025;
// Season kicks off Saturday, Sept 6, 2025; one round per week.
const SEASON_START_UTC = Date.UTC(2025, 8, 6, 23, 30);

// --- deterministic pseudo-random numbers (reproducible seeds) -------------

// Chosen so the simulated season lands on believable records
// (Ole Miss 6-2, Georgia 7-1, Mississippi State 0-8, a few upsets).
let lcgState = 51;
function rand(): number {
  lcgState = (lcgState * 1664525 + 1013904223) % 4294967296;
  return lcgState / 4294967296;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// --- team definitions ------------------------------------------------------

interface SeedTeam {
  name: string;
  abbreviation: string;
  mascot: string;
  conference: string;
  city: string;
  state: string;
  primaryColor: string;
  secondaryColor: string;
  /** 0..1 overall quality — drives simulated results. */
  rating: number;
  /** Hand-tuned season stats not derived from game scores. */
  yardsPerGame: number;
  yardsAllowedPerGame: number;
  turnoverMargin: number;
}

const TEAMS: SeedTeam[] = [
  { name: 'Ole Miss', abbreviation: 'MISS', mascot: 'Rebels', conference: 'SEC', city: 'Oxford', state: 'MS', primaryColor: '#14213D', secondaryColor: '#CE1126', rating: 0.87, yardsPerGame: 472.3, yardsAllowedPerGame: 305.1, turnoverMargin: 8 },
  { name: 'Georgia', abbreviation: 'UGA', mascot: 'Bulldogs', conference: 'SEC', city: 'Athens', state: 'GA', primaryColor: '#BA0C2F', secondaryColor: '#000000', rating: 0.92, yardsPerGame: 468.1, yardsAllowedPerGame: 268.4, turnoverMargin: 9 },
  { name: 'Texas', abbreviation: 'TEX', mascot: 'Longhorns', conference: 'SEC', city: 'Austin', state: 'TX', primaryColor: '#BF5700', secondaryColor: '#FFFFFF', rating: 0.88, yardsPerGame: 455.6, yardsAllowedPerGame: 289.7, turnoverMargin: 7 },
  { name: 'Alabama', abbreviation: 'ALA', mascot: 'Crimson Tide', conference: 'SEC', city: 'Tuscaloosa', state: 'AL', primaryColor: '#9E1B32', secondaryColor: '#FFFFFF', rating: 0.85, yardsPerGame: 441.2, yardsAllowedPerGame: 281.9, turnoverMargin: 5 },
  { name: 'Tennessee', abbreviation: 'TENN', mascot: 'Volunteers', conference: 'SEC', city: 'Knoxville', state: 'TN', primaryColor: '#FF8200', secondaryColor: '#58595B', rating: 0.78, yardsPerGame: 438.4, yardsAllowedPerGame: 331.2, turnoverMargin: 3 },
  { name: 'LSU', abbreviation: 'LSU', mascot: 'Tigers', conference: 'SEC', city: 'Baton Rouge', state: 'LA', primaryColor: '#461D7C', secondaryColor: '#FDD023', rating: 0.75, yardsPerGame: 429.8, yardsAllowedPerGame: 348.5, turnoverMargin: 2 },
  { name: 'Florida', abbreviation: 'FLA', mascot: 'Gators', conference: 'SEC', city: 'Gainesville', state: 'FL', primaryColor: '#0021A5', secondaryColor: '#FA4616', rating: 0.62, yardsPerGame: 385.2, yardsAllowedPerGame: 376.3, turnoverMargin: -1 },
  { name: 'Auburn', abbreviation: 'AUB', mascot: 'Tigers', conference: 'SEC', city: 'Auburn', state: 'AL', primaryColor: '#0C2340', secondaryColor: '#E87722', rating: 0.58, yardsPerGame: 371.4, yardsAllowedPerGame: 383.8, turnoverMargin: -2 },
  { name: 'Arkansas', abbreviation: 'ARK', mascot: 'Razorbacks', conference: 'SEC', city: 'Fayetteville', state: 'AR', primaryColor: '#9D2235', secondaryColor: '#FFFFFF', rating: 0.52, yardsPerGame: 356.7, yardsAllowedPerGame: 401.2, turnoverMargin: -4 },
  { name: 'Mississippi State', abbreviation: 'MSST', mascot: 'Bulldogs', conference: 'SEC', city: 'Starkville', state: 'MS', primaryColor: '#660000', secondaryColor: '#FFFFFF', rating: 0.45, yardsPerGame: 334.9, yardsAllowedPerGame: 428.6, turnoverMargin: -6 },
];

// --- schedule generation ----------------------------------------------------

interface SeedGame {
  week: number;
  homeIdx: number;
  awayIdx: number;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
}

/** Classic circle-method round robin: n teams → n-1 rounds of n/2 pairings. */
function roundRobinRounds(n: number): [number, number][][] {
  const rounds: [number, number][][] = [];
  const rotation = Array.from({ length: n - 1 }, (_, i) => i + 1);
  for (let r = 0; r < n - 1; r++) {
    const round: [number, number][] = [[0, rotation[0]]];
    for (let i = 1; i < n / 2; i++) {
      round.push([rotation[i], rotation[n - 1 - i]]);
    }
    rounds.push(round);
    rotation.unshift(rotation.pop() as number);
  }
  return rounds;
}

/** Simulate a final score from the two teams' ratings + home field. */
function simulateScore(home: SeedTeam, away: SeedTeam): { homeScore: number; awayScore: number } {
  // Each side's points scale with its own offense (rating) and the softness
  // of the opposing defense, +2.5 for home field, plus bounded noise so
  // upsets are possible but rare.
  let homeScore = Math.round(
    clamp(13 + home.rating * 21 + (1 - away.rating) * 9 + 2.5 + (rand() * 9 - 4.5), 6, 56)
  );
  let awayScore = Math.round(
    clamp(13 + away.rating * 21 + (1 - home.rating) * 9 + (rand() * 9 - 4.5), 6, 56)
  );
  if (homeScore === awayScore) {
    // No ties in college football — nudge toward the rating favorite.
    if (home.rating >= away.rating) homeScore += 3;
    else awayScore += 3;
  }
  return { homeScore, awayScore };
}

function buildSchedule(): SeedGame[] {
  const missIdx = TEAMS.findIndex((t) => t.abbreviation === 'MISS');
  const msstIdx = TEAMS.findIndex((t) => t.abbreviation === 'MSST');

  const rounds = roundRobinRounds(TEAMS.length);

  // Move the round containing the Egg Bowl to the end so it is the
  // upcoming (SCHEDULED) game for both Mississippi schools.
  const eggBowlRound = rounds.findIndex((round) =>
    round.some(([a, b]) => (a === missIdx && b === msstIdx) || (a === msstIdx && b === missIdx))
  );
  const [eggRound] = rounds.splice(eggBowlRound, 1);
  rounds.push(eggRound);

  const games: SeedGame[] = [];
  rounds.forEach((round, roundIdx) => {
    const week = roundIdx + 1;
    const isFinal = week < rounds.length; // last round = upcoming games

    for (const [a, b] of round) {
      // Alternate home/away deterministically; force Ole Miss to host the
      // Egg Bowl so the dashboard preview shows a home game.
      let homeIdx = (roundIdx + a + b) % 2 === 0 ? a : b;
      if ((a === missIdx && b === msstIdx) || (a === msstIdx && b === missIdx)) {
        homeIdx = missIdx;
      }
      const awayIdx = homeIdx === a ? b : a;

      const score = isFinal ? simulateScore(TEAMS[homeIdx], TEAMS[awayIdx]) : null;
      games.push({
        week,
        homeIdx,
        awayIdx,
        status: isFinal ? GameStatus.FINAL : GameStatus.SCHEDULED,
        homeScore: score ? score.homeScore : null,
        awayScore: score ? score.awayScore : null,
      });
    }
  });

  return games;
}

// --- stat derivation ---------------------------------------------------------

interface DerivedStats {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  /** W/L of played games in week order (for recent form). */
  results: boolean[];
  /** Ratings of opponents faced (for strength of schedule). */
  opponentRatings: number[];
}

function deriveStats(games: SeedGame[]): DerivedStats[] {
  const stats: DerivedStats[] = TEAMS.map(() => ({
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    results: [],
    opponentRatings: [],
  }));

  for (const g of games.filter((g) => g.status === GameStatus.FINAL)) {
    const hs = g.homeScore!;
    const as = g.awayScore!;
    const home = stats[g.homeIdx];
    const away = stats[g.awayIdx];

    home.pointsFor += hs;
    home.pointsAgainst += as;
    away.pointsFor += as;
    away.pointsAgainst += hs;
    home.opponentRatings.push(TEAMS[g.awayIdx].rating);
    away.opponentRatings.push(TEAMS[g.homeIdx].rating);

    const homeWon = hs > as;
    home.results.push(homeWon);
    away.results.push(!homeWon);
    if (homeWon) {
      home.wins++;
      away.losses++;
    } else {
      away.wins++;
      home.losses++;
    }
  }

  return stats;
}

// --- main --------------------------------------------------------------------

async function main() {
  console.log('Clearing existing data…');
  await prisma.savedPrediction.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.game.deleteMany();
  await prisma.teamSeasonStats.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating teams…');
  const teamIds: number[] = [];
  for (const t of TEAMS) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        abbreviation: t.abbreviation,
        mascot: t.mascot,
        conference: t.conference,
        city: t.city,
        state: t.state,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
      },
    });
    teamIds.push(team.id);
  }

  console.log('Creating games…');
  const schedule = buildSchedule();
  for (const g of schedule) {
    await prisma.game.create({
      data: {
        season: SEASON,
        week: g.week,
        date: new Date(SEASON_START_UTC + (g.week - 1) * 7 * 24 * 60 * 60 * 1000),
        status: g.status,
        isConferenceGame: true,
        homeTeamId: teamIds[g.homeIdx],
        awayTeamId: teamIds[g.awayIdx],
        homeScore: g.homeScore,
        awayScore: g.awayScore,
      },
    });
  }

  console.log('Creating season stats…');
  const derived = deriveStats(schedule);
  for (let i = 0; i < TEAMS.length; i++) {
    const t = TEAMS[i];
    const d = derived[i];
    const played = d.wins + d.losses;
    const lastFive = d.results.slice(-5);
    const avgOpponentRating =
      d.opponentRatings.reduce((sum, r) => sum + r, 0) / d.opponentRatings.length;

    await prisma.teamSeasonStats.create({
      data: {
        teamId: teamIds[i],
        season: SEASON,
        wins: d.wins,
        losses: d.losses,
        // All seeded games are SEC games in this demo.
        conferenceWins: d.wins,
        conferenceLosses: d.losses,
        pointsPerGame: Math.round((d.pointsFor / played) * 10) / 10,
        pointsAllowedPerGame: Math.round((d.pointsAgainst / played) * 10) / 10,
        yardsPerGame: t.yardsPerGame,
        yardsAllowedPerGame: t.yardsAllowedPerGame,
        turnoverMargin: t.turnoverMargin,
        strengthOfSchedule: Math.round(avgOpponentRating * 100) / 100,
        recentFormScore: lastFive.filter(Boolean).length * 2,
      },
    });

    console.log(
      `  ${t.name.padEnd(18)} ${d.wins}-${d.losses}  ` +
        `${(d.pointsFor / played).toFixed(1)} PPG / ${(d.pointsAgainst / played).toFixed(1)} PAPG`
    );
  }

  console.log('Creating demo user (demo@cfb.dev / password123)…');
  await prisma.user.create({
    data: {
      email: 'demo@cfb.dev',
      name: 'Demo User',
      passwordHash: await bcrypt.hash('password123', 10),
    },
  });

  console.log(`Seed complete: ${TEAMS.length} teams, ${schedule.length} games, season ${SEASON}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
