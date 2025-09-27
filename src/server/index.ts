import { router, publicProcedure } from "./trpc";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { db } from "../db";
import { matchTable, playersTable, teamsTable, pointsTable, usersTable } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import z from "zod";
import "dotenv/config";

const appRouter = router({
  getUsers: publicProcedure.query(async () => {
    const users = await db.select().from(usersTable);

    return users;
  }),

  getUnassignedPlayers: publicProcedure.query(async () => {
    return await db.select().from(playersTable).where(isNull(playersTable.teamId)); // ← only players without a team
  }),

  playerCreate: publicProcedure
    .input(
      z.object({
        playerName: z.string().min(1),
        goals: z.number().int().min(0),
        assists: z.number().int().min(0),
        yellowCard: z.number().int().min(0),
        redCard: z.number().int().min(0),
        teamId: z.number().int().optional(),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;

      const existingPlayer = await db.query.playersTable.findFirst({
        where: eq(playersTable.playerName, input.playerName.trim()),
      });

      if (existingPlayer) {
        throw new Error("The player with this name already exists.");
      }

      const [newPlayer] = await db.insert(playersTable).values(input).returning();

      return newPlayer;
    }),

  getPlayers: publicProcedure.query(async () => {
    const players = await db.query.playersTable.findMany({});

    return players;
  }),

  teamCreate: publicProcedure
    .input(
      z.object({
        teamName: z.string().min(1, "Team name is required"),
        color: z.string().min(1, "Color is required"),
        description: z.string().optional().default("No description"),
        playerIds: z.array(z.number()).optional().default([]),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;
      const { playerIds, ...teamData } = input;

      console.log(input);

      const existingTeam = await db.query.teamsTable.findFirst({
        where: eq(teamsTable.teamName, input.teamName.trim()),
      });

      if (existingTeam) {
        throw new Error("A team with this name already exists.");
      }

      const [newTeam] = await db
        .insert(teamsTable)
        .values({
          ...teamData,
          teamName: teamData.teamName.trim(),
        })
        .returning();

      if (!newTeam) {
        throw new Error("Failed to create team");
      }

      await db.insert(pointsTable).values({
        teamId: newTeam.id,
      });

      // assign players to the team
      if (playerIds.length > 0) {
        for (const playerId of playerIds) {
          await db
            .update(playersTable)
            .set({ teamId: newTeam.id })
            .where(eq(playersTable.id, playerId));
        }
      }

      return newTeam;
    }),

  getTeams: publicProcedure.query(async () => {
    const teams = await db.query.teamsTable.findMany({
      with: {
        players: true,
        score: true,
      },
    });

    return teams;
  }),

  playerUpdate: publicProcedure
    .input(
      z.object({
        id: z.number().int().min(1),
        playerName: z.string().min(1),
        goals: z.number().int().min(0),
        assists: z.number().int().min(0),
        yellowCard: z.number().int().min(0),
        redCard: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const { id, playerName, goals, assists, yellowCard, redCard } = input;

      const existingPlayer = await db.query.playersTable.findFirst({
        where: eq(playersTable.id, id),
      });

      if (!existingPlayer) {
        throw new Error("Player not found");
      }

      await db
        .update(playersTable)
        .set({
          playerName,
          goals: existingPlayer.goals + goals,
          assists: existingPlayer.assists + assists,
          yellowCard: existingPlayer.yellowCard + yellowCard,
          redCard: existingPlayer.redCard + redCard,
        })
        .where(eq(playersTable.id, id));

      return { success: true };
    }),

  updatePoints: publicProcedure
    .input(
      z.object({
        homeTeamId: z.number().int().min(1),
        awayTeamId: z.number().int().min(1),
        homeTeamName: z.string().min(1),
        awayTeamName: z.string().min(1),
        homeTeamScore: z.number().int().min(0),
        awayTeamScore: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const { homeTeamId, awayTeamId, homeTeamName, awayTeamName, homeTeamScore, awayTeamScore } =
        input;

      // Update team names
      await db
        .update(teamsTable)
        .set({ teamName: homeTeamName })
        .where(eq(teamsTable.id, homeTeamId));

      await db
        .update(teamsTable)
        .set({ teamName: awayTeamName })
        .where(eq(teamsTable.id, awayTeamId));

      // Update team scores
      await db
        .update(pointsTable)
        .set({ goalsFor: homeTeamScore })
        .where(eq(pointsTable.teamId, homeTeamId));

      await db
        .update(pointsTable)
        .set({ goalsFor: awayTeamScore })
        .where(eq(pointsTable.teamId, awayTeamId));

      console.log({ input });
      return input;
    }),

  recordMatchScores: publicProcedure
    .input(
      z.object({
        homeTeamId: z.number(),
        awayTeamId: z.number(),
        homeGoals: z.number().min(0),
        awayGoals: z.number().min(0),
        matchDate: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { homeTeamId, awayTeamId, homeGoals, awayGoals, matchDate } = input;
      const [homeTeam, awayTeam] = await Promise.all([
        db.query.teamsTable.findFirst({ where: eq(teamsTable.id, homeTeamId) }),
        db.query.teamsTable.findFirst({ where: eq(teamsTable.id, awayTeamId) }),
      ]);
      if (!homeTeam || !awayTeam) {
        throw new Error("Team not found");
      }

      //record the match
      await db.insert(matchTable).values({
        homeTeamId,
        awayTeamId,
        homeGoals,
        awayGoals,
        matchDate,
      });

      const [homeStats, awayStats] = await Promise.all([
        db.query.pointsTable.findFirst({ where: eq(pointsTable.teamId, homeTeamId) }),
        db.query.pointsTable.findFirst({ where: eq(pointsTable.teamId, awayTeamId) }),
      ]);

      if (!homeStats || !awayStats) {
        throw new Error("Stats not found for one of the teams");
      }

      const homeIsWin = homeGoals > awayGoals;
      const homeIsDraw = homeGoals === awayGoals;

      const updatedHome = {
        gamesPlayed: homeStats.gamesPlayed + 1,
        goalsFor: homeStats.goalsFor + homeGoals,
        goalsAgainst: homeStats.goalsAgainst + awayGoals,
        goalDifference: homeStats.goalsFor + homeGoals - (homeStats.goalsAgainst + awayGoals),
        gamesWon: homeStats.gamesWon + (homeIsWin ? 1 : 0),
        gamesDrawn: homeStats.gamesDrawn + (homeIsDraw ? 1 : 0),
        gamesLost: homeStats.gamesLost + (!homeIsWin && !homeIsDraw ? 1 : 0),
        points: homeStats.points + (homeIsWin ? 3 : homeIsDraw ? 1 : 0),
      };

      const awayIsWin = awayGoals > homeGoals;
      const awayIsDraw = homeGoals === awayGoals;

      const updatedAway = {
        gamesPlayed: awayStats.gamesPlayed + 1,
        goalsFor: awayStats.goalsFor + awayGoals,
        goalsAgainst: awayStats.goalsAgainst + homeGoals,
        goalDifference: awayStats.goalsFor + awayGoals - (awayStats.goalsAgainst + homeGoals),
        gamesWon: awayStats.gamesWon + (awayIsWin ? 1 : 0),
        gamesDrawn: awayStats.gamesDrawn + (awayIsDraw ? 1 : 0),
        gamesLost: awayStats.gamesLost + (!awayIsWin && !awayIsDraw ? 1 : 0),
        points: awayStats.points + (awayIsWin ? 3 : awayIsDraw ? 1 : 0),
      };

      // 4. Persist updates
      await Promise.all([
        db.update(pointsTable).set(updatedHome).where(eq(pointsTable.teamId, homeTeamId)),
        db.update(pointsTable).set(updatedAway).where(eq(pointsTable.teamId, awayTeamId)),
      ]);
    }),
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  middleware: cors({
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
});

server.listen(3005, () => {
  console.log("Listening on port 3005");
});
