import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { db } from "../db/db.js";
import {
  competitionsTable,
  matchTable,
  playersTable,
  teamsTable,
  pointsTable,
  usersTable,
} from "../db/schema.js";
import { and, desc, eq, isNull } from "drizzle-orm";
import z from "zod";
import {
  compareHashedPassword,
  hashPassword,
  setCookieSession,
  clearCookieSession,
} from "../lib/session.js";

// import "dotenv/config";

async function findActiveCompetition() {
  return (
    (await db.get().query.competitionsTable.findFirst({
      where: eq(competitionsTable.status, "active"),
      orderBy: [desc(competitionsTable.createdAt)],
    })) ?? null
  );
}

async function resolveCompetitionId(competitionId?: number) {
  if (competitionId) {
    return competitionId;
  }

  const active = await findActiveCompetition();
  return active?.id ?? null;
}

export const appRouter = router({
  getAdminSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    const { id, username, email } = ctx.user;
    return { id, username, email };
  }),

  getUsers: protectedProcedure.query(async () => {
    const users = await db
      .get()
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(usersTable);

    return users;
  }),

  //signup (restricted to signed-in admins)
  userSignUp: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1).trim(),
        email: z.email().trim(),
        password: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      const { input } = opts;

      const existingAdminUser = await db.get().query.usersTable.findFirst({
        where: eq(usersTable.email, input.email.trim()),
      });

      if (existingAdminUser) {
        throw new Error("An admin with this email already exists.");
      }

      //hash password
      const hashedPassword = await hashPassword(input.password);

      const [newAdmin] = await db
        .get()
        .insert(usersTable)
        .values({
          username: input.username.trim(),
          password: hashedPassword,
          email: input.email.trim(),
        })
        .returning();

      const { id, username, email } = newAdmin;
      return { id, username, email };
    }),

  //login
  userLogin: publicProcedure
    .input(
      z.object({
        email: z.email().trim(),
        password: z.string().min(1),
      })
    )
    .mutation(async (opts) => {
      const { input, ctx } = opts;

      const existingUser = await db.get().query.usersTable.findFirst({
        where: eq(usersTable.email, input.email.trim()),
      });

      if (!existingUser) {
        throw Error("email or password incorrect");
      }

      const comparePassword = await compareHashedPassword(
        input.password.trim(),
        existingUser.password
      );

      if (!comparePassword) {
        throw Error("email or password incorrect");
      }

      const sessionPayload = {
        userId: existingUser.id.toString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await setCookieSession(sessionPayload, ctx.res);

      return { message: "Login successful" };
    }),

  //logout
  userLogout: protectedProcedure.mutation(async ({ ctx }) => {
    await clearCookieSession(ctx.res);

    return { message: "Logged out" };
  }),

  // ---- competitions -------------------------------------------------------

  getActiveCompetition: publicProcedure.query(async () => {
    return findActiveCompetition();
  }),

  competitionsList: publicProcedure.query(async () => {
    return db.get().query.competitionsTable.findMany({
      orderBy: [desc(competitionsTable.createdAt)],
      with: {
        teams: { with: { score: true } },
      },
    });
  }),

  getCompetition: publicProcedure
    .input(z.object({ competitionId: z.number().int().min(1) }))
    .query(async ({ input }) => {
      return db.get().query.competitionsTable.findFirst({
        where: eq(competitionsTable.id, input.competitionId),
        with: {
          teams: { with: { players: true, score: true } },
          matches: true,
        },
      });
    }),

  // Archives the current competition and starts a fresh one. Teams and players
  // are carried forward, but every stat is reset to zero. Nothing is deleted.
  competitionCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1).trim() }))
    .mutation(async ({ input }) => {
      const current = await findActiveCompetition();

      const [newCompetition] = await db
        .get()
        .insert(competitionsTable)
        .values({ name: input.name.trim(), status: "active" })
        .returning();

      if (!newCompetition) {
        throw new Error("Failed to create competition");
      }

      if (current) {
        // Archive the competition that is currently running.
        await db
          .get()
          .update(competitionsTable)
          .set({ status: "completed" })
          .where(eq(competitionsTable.id, current.id));

        // Carry teams forward with a fresh (zeroed) standings row each.
        const oldTeams = await db.get().query.teamsTable.findMany({
          where: eq(teamsTable.competitionId, current.id),
        });

        const teamIdMap = new Map<number, number>();

        for (const team of oldTeams) {
          const [newTeam] = await db
            .get()
            .insert(teamsTable)
            .values({
              teamName: team.teamName,
              color: team.color,
              description: team.description,
              competitionId: newCompetition.id,
            })
            .returning();

          if (!newTeam) {
            continue;
          }

          teamIdMap.set(team.id, newTeam.id);

          await db.get().insert(pointsTable).values({
            teamId: newTeam.id,
            competitionId: newCompetition.id,
          });
        }

        // Carry players forward with zeroed stats, keeping their squad.
        const oldPlayers = await db.get().query.playersTable.findMany({
          where: eq(playersTable.competitionId, current.id),
        });

        for (const player of oldPlayers) {
          await db.get().insert(playersTable).values({
            playerName: player.playerName,
            goals: 0,
            assists: 0,
            yellowCard: 0,
            redCard: 0,
            competitionId: newCompetition.id,
            teamId: player.teamId ? teamIdMap.get(player.teamId) ?? null : null,
          });
        }
      }

      return newCompetition;
    }),

  // ---- players ------------------------------------------------------------

  getUnassignedPlayers: protectedProcedure
    .input(z.object({ competitionId: z.number().int().optional() }).optional())
    .query(async ({ input }) => {
      const competitionId = await resolveCompetitionId(input?.competitionId);

      if (!competitionId) {
        return [];
      }

      return db.get().query.playersTable.findMany({
        where: and(isNull(playersTable.teamId), eq(playersTable.competitionId, competitionId)),
      });
    }),

  getPlayers: publicProcedure
    .input(z.object({ competitionId: z.number().int().optional() }).optional())
    .query(async ({ input }) => {
      const competitionId = await resolveCompetitionId(input?.competitionId);

      if (!competitionId) {
        return [];
      }

      return db.get().query.playersTable.findMany({
        where: eq(playersTable.competitionId, competitionId),
      });
    }),

  playerCreate: protectedProcedure
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

      const active = await findActiveCompetition();

      if (!active) {
        throw new Error("No active competition. Create a competition first.");
      }

      const existingPlayer = await db.get().query.playersTable.findFirst({
        where: and(
          eq(playersTable.playerName, input.playerName.trim()),
          eq(playersTable.competitionId, active.id)
        ),
      });

      if (existingPlayer) {
        throw new Error("The player with this name already exists in this competition.");
      }

      const [newPlayer] = await db
        .get()
        .insert(playersTable)
        .values({ ...input, playerName: input.playerName.trim(), competitionId: active.id })
        .returning();

      return newPlayer;
    }),

  playerUpdate: protectedProcedure
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

      const active = await findActiveCompetition();

      const existingPlayer = await db.get().query.playersTable.findFirst({
        where: eq(playersTable.id, id),
      });

      if (!existingPlayer) {
        throw new Error("Player not found");
      }

      if (active && existingPlayer.competitionId !== active.id) {
        throw new Error("This player belongs to an archived competition.");
      }

      await db
        .get()
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

  // ---- teams --------------------------------------------------------------

  teamCreate: protectedProcedure
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

      const active = await findActiveCompetition();

      if (!active) {
        throw new Error("No active competition. Create a competition first.");
      }

      const existingTeam = await db.get().query.teamsTable.findFirst({
        where: and(
          eq(teamsTable.teamName, input.teamName.trim()),
          eq(teamsTable.competitionId, active.id)
        ),
      });

      if (existingTeam) {
        throw new Error("A team with this name already exists in this competition.");
      }

      const [newTeam] = await db
        .get()
        .insert(teamsTable)
        .values({
          ...teamData,
          teamName: teamData.teamName.trim(),
          competitionId: active.id,
        })
        .returning();

      if (!newTeam) {
        throw new Error("Failed to create team");
      }

      await db.get().insert(pointsTable).values({
        teamId: newTeam.id,
        competitionId: active.id,
      });

      // assign players to the team
      if (playerIds.length > 0) {
        for (const playerId of playerIds) {
          await db
            .get()
            .update(playersTable)
            .set({ teamId: newTeam.id })
            .where(eq(playersTable.id, playerId));
        }
      }

      return newTeam;
    }),

  getTeams: publicProcedure
    .input(z.object({ competitionId: z.number().int().optional() }).optional())
    .query(async ({ input }) => {
      const competitionId = await resolveCompetitionId(input?.competitionId);

      if (!competitionId) {
        return [];
      }

      const teams = await db.get().query.teamsTable.findMany({
        where: eq(teamsTable.competitionId, competitionId),
        with: {
          players: true,
          score: true,
        },
      });

      return teams;
    }),

  recordMatchScores: protectedProcedure
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

      const active = await findActiveCompetition();

      if (!active) {
        throw new Error("No active competition.");
      }

      const [homeTeam, awayTeam] = await Promise.all([
        db.get().query.teamsTable.findFirst({ where: eq(teamsTable.id, homeTeamId) }),
        db.get().query.teamsTable.findFirst({ where: eq(teamsTable.id, awayTeamId) }),
      ]);
      if (!homeTeam || !awayTeam) {
        throw new Error("Team not found");
      }

      if (homeTeam.competitionId !== active.id || awayTeam.competitionId !== active.id) {
        throw new Error("Both teams must belong to the active competition.");
      }

      //record the match
      await db.get().insert(matchTable).values({
        homeTeamId,
        awayTeamId,
        homeGoals,
        awayGoals,
        matchDate,
        competitionId: active.id,
      });

      const [homeStats, awayStats] = await Promise.all([
        db
          .get()
          .query.pointsTable.findFirst({
            where: and(eq(pointsTable.teamId, homeTeamId), eq(pointsTable.competitionId, active.id)),
          }),
        db
          .get()
          .query.pointsTable.findFirst({
            where: and(eq(pointsTable.teamId, awayTeamId), eq(pointsTable.competitionId, active.id)),
          }),
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
        db
          .get()
          .update(pointsTable)
          .set(updatedHome)
          .where(and(eq(pointsTable.teamId, homeTeamId), eq(pointsTable.competitionId, active.id))),
        db
          .get()
          .update(pointsTable)
          .set(updatedAway)
          .where(and(eq(pointsTable.teamId, awayTeamId), eq(pointsTable.competitionId, active.id))),
      ]);
    }),
});

export type AppRouter = typeof appRouter;
