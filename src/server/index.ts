import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { db } from "../db/db.js";
import {
  competitionsTable,
  matchTable,
  newsTable,
  playersTable,
  predictionEntriesTable,
  teamsTable,
  pointsTable,
  teamOfTheWeekTable,
  usersTable,
} from "../db/schema.js";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
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

async function requireActiveCompetition() {
  const active = await findActiveCompetition();
  if (!active) {
    throw new Error("No active competition.");
  }
  return active;
}

async function resolveCompetitionId(competitionId?: number) {
  if (competitionId) {
    return competitionId;
  }

  const active = await findActiveCompetition();
  return active?.id ?? null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function excerptFromMarkdown(content: string, maxLength = 140): string {
  const text = content
    .replace(/^\s*([#>-]|!\[.*?\]\(.*?\)|---).*$/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[|\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

const DEFAULT_PRIZE_LABEL = "₦2,000 airtime";

function normalizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatMatchDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Applies (dir = 1) or reverses (dir = -1) the standings contribution of a
// single result. Additive, so re-recording a corrected score is idempotent.
async function applyMatchPoints(
  competitionId: number,
  homeTeamId: number,
  awayTeamId: number,
  homeGoals: number,
  awayGoals: number,
  dir: 1 | -1
) {
  const [homeStats, awayStats] = await Promise.all([
    db
      .get()
      .query.pointsTable.findFirst({
        where: and(eq(pointsTable.teamId, homeTeamId), eq(pointsTable.competitionId, competitionId)),
      }),
    db
      .get()
      .query.pointsTable.findFirst({
        where: and(eq(pointsTable.teamId, awayTeamId), eq(pointsTable.competitionId, competitionId)),
      }),
  ]);

  if (!homeStats || !awayStats) {
    throw new Error("Stats not found for one of the teams");
  }

  const homeIsWin = homeGoals > awayGoals;
  const homeIsDraw = homeGoals === awayGoals;

  const updatedHome = {
    gamesPlayed: homeStats.gamesPlayed + dir,
    goalsFor: homeStats.goalsFor + dir * homeGoals,
    goalsAgainst: homeStats.goalsAgainst + dir * awayGoals,
    goalDifference: homeStats.goalDifference + dir * (homeGoals - awayGoals),
    gamesWon: homeStats.gamesWon + dir * (homeIsWin ? 1 : 0),
    gamesDrawn: homeStats.gamesDrawn + dir * (homeIsDraw ? 1 : 0),
    gamesLost: homeStats.gamesLost + dir * (!homeIsWin && !homeIsDraw ? 1 : 0),
    points: homeStats.points + dir * (homeIsWin ? 3 : homeIsDraw ? 1 : 0),
  };

  const awayIsWin = awayGoals > homeGoals;
  const awayIsDraw = homeGoals === awayGoals;

  const updatedAway = {
    gamesPlayed: awayStats.gamesPlayed + dir,
    goalsFor: awayStats.goalsFor + dir * awayGoals,
    goalsAgainst: awayStats.goalsAgainst + dir * homeGoals,
    goalDifference: awayStats.goalDifference + dir * (awayGoals - homeGoals),
    gamesWon: awayStats.gamesWon + dir * (awayIsWin ? 1 : 0),
    gamesDrawn: awayStats.gamesDrawn + dir * (awayIsDraw ? 1 : 0),
    gamesLost: awayStats.gamesLost + dir * (!awayIsWin && !awayIsDraw ? 1 : 0),
    points: awayStats.points + dir * (awayIsWin ? 3 : awayIsDraw ? 1 : 0),
  };

  await Promise.all([
    db
      .get()
      .update(pointsTable)
      .set(updatedHome)
      .where(and(eq(pointsTable.teamId, homeTeamId), eq(pointsTable.competitionId, competitionId))),
    db
      .get()
      .update(pointsTable)
      .set(updatedAway)
      .where(and(eq(pointsTable.teamId, awayTeamId), eq(pointsTable.competitionId, competitionId))),
  ]);
}

// Serialises a match row (with joined teams) for the client.
function matchToDto(match: {
  id: number;
  round: number | null;
  kickoffAt: Date | string | null;
  status: string;
  prizeLabel: string;
  matchDate: string;
  homeGoals: number | null;
  awayGoals: number | null;
  competitionId: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeTeam?: { id: number; teamName: string; color: string } | null;
  awayTeam?: { id: number; teamName: string; color: string } | null;
}) {
  return {
    id: match.id,
    round: match.round,
    kickoffAt: match.kickoffAt ? new Date(match.kickoffAt).toISOString() : null,
    status: match.status,
    prizeLabel: match.prizeLabel,
    matchDate: match.matchDate,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    competitionId: match.competitionId,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeam: match.homeTeam ?? null,
    awayTeam: match.awayTeam ?? null,
  };
}

function totwPlayerToDto(player: {
  id: number;
  playerName: string;
  goals: number;
  assists: number;
  yellowCard: number;
  redCard: number;
  team?: { id: number; teamName: string; color: string } | null;
} | null) {
  if (!player) {
    return null;
  }

  return {
    id: player.id,
    playerName: player.playerName,
    goals: player.goals,
    assists: player.assists,
    yellowCard: player.yellowCard,
    redCard: player.redCard,
    team: player.team
      ? { id: player.team.id, teamName: player.team.teamName, color: player.team.color }
      : null,
  };
}

// Serialises a team of the week row (with players and their teams) for the client.
function teamOfTheWeekToDto(totw: {
  id: number;
  weekLabel: string | null;
  competitionId: number;
  updatedAt: Date | string;
  competition?: { name: string } | null;
  defenderOne: Parameters<typeof totwPlayerToDto>[0];
  defenderTwo: Parameters<typeof totwPlayerToDto>[0];
  midfielder: Parameters<typeof totwPlayerToDto>[0];
  forwardOne: Parameters<typeof totwPlayerToDto>[0];
  forwardTwo: Parameters<typeof totwPlayerToDto>[0];
  subOne: Parameters<typeof totwPlayerToDto>[0];
  subTwo: Parameters<typeof totwPlayerToDto>[0];
  subThree: Parameters<typeof totwPlayerToDto>[0];
  subFour: Parameters<typeof totwPlayerToDto>[0];
}) {
  return {
    id: totw.id,
    weekLabel: totw.weekLabel,
    competitionId: totw.competitionId,
    competitionName: totw.competition?.name ?? null,
    updatedAt: new Date(totw.updatedAt).toISOString(),
    defenderOne: totwPlayerToDto(totw.defenderOne),
    defenderTwo: totwPlayerToDto(totw.defenderTwo),
    midfielder: totwPlayerToDto(totw.midfielder),
    forwardOne: totwPlayerToDto(totw.forwardOne),
    forwardTwo: totwPlayerToDto(totw.forwardTwo),
    subOne: totwPlayerToDto(totw.subOne),
    subTwo: totwPlayerToDto(totw.subTwo),
    subThree: totwPlayerToDto(totw.subThree),
    subFour: totwPlayerToDto(totw.subFour),
  };
}

// Marks every entry as lost, then awards the earliest eligible exact-score
// guess. Idempotent: safe to re-run after a score correction.
async function settleMatch(matchId: number) {
  const match = await db.get().query.matchTable.findFirst({
    where: eq(matchTable.id, matchId),
  });

  if (!match) {
    throw new Error("Fixture not found.");
  }

  if (match.status !== "final" || match.homeGoals == null || match.awayGoals == null) {
    throw new Error("This fixture has no final score to settle against.");
  }

  const entries = await db.get().query.predictionEntriesTable.findMany({
    where: eq(predictionEntriesTable.matchId, matchId),
  });

  if (entries.length === 0) {
    return { winnerId: null as number | null };
  }

  const exact = entries
    .filter(
      (entry) =>
        entry.eligible &&
        entry.guessedHomeGoals === match.homeGoals &&
        entry.guessedAwayGoals === match.awayGoals
    )
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

  const winner = exact[0] ?? null;

  await db
    .get()
    .update(predictionEntriesTable)
    .set({ status: "lost" })
    .where(eq(predictionEntriesTable.matchId, matchId));

  if (winner) {
    await db
      .get()
      .update(predictionEntriesTable)
      .set({ status: "won" })
      .where(eq(predictionEntriesTable.id, winner.id));
  }

  return { winnerId: winner?.id ?? null };
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

  // ---- news ---------------------------------------------------------------

  newsList: publicProcedure.query(async () => {
    const items = await db
      .get()
      .select({
        id: newsTable.id,
        slug: newsTable.slug,
        title: newsTable.title,
        date: newsTable.date,
        coverImage: newsTable.coverImage,
        content: newsTable.content,
        createdAt: newsTable.createdAt,
      })
      .from(newsTable)
      .orderBy(desc(newsTable.createdAt));

    return items.map(({ content, ...item }) => ({
      ...item,
      excerpt: excerptFromMarkdown(content),
    }));
  }),

  getNews: publicProcedure
    .input(z.object({ slug: z.string().trim().min(1) }))
    .query(async ({ input }) => {
      return (
        (await db.get().query.newsTable.findFirst({
          where: eq(newsTable.slug, input.slug),
        })) ?? null
      );
    }),

  newsCreate: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).trim(),
        date: z.string().min(1).trim(),
        coverImage: z.string().trim().optional().default(""),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const slug = slugify(input.title);

      if (!slug) {
        throw new Error("Title must contain letters or numbers.");
      }

      const existing = await db.get().query.newsTable.findFirst({
        where: eq(newsTable.slug, slug),
      });

      if (existing) {
        throw new Error("An article with this title already exists.");
      }

      const [article] = await db
        .get()
        .insert(newsTable)
        .values({
          slug,
          title: input.title,
          date: input.date,
          coverImage: input.coverImage || null,
          content: input.content,
        })
        .returning();

      return article;
    }),

  newsUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number().int().min(1),
        title: z.string().min(1).trim(),
        date: z.string().min(1).trim(),
        coverImage: z.string().trim().optional().default(""),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await db.get().query.newsTable.findFirst({
        where: eq(newsTable.id, input.id),
      });

      if (!existing) {
        throw new Error("News article not found.");
      }

      const slug = slugify(input.title);

      if (!slug) {
        throw new Error("Title must contain letters or numbers.");
      }

      const clash = await db.get().query.newsTable.findFirst({
        where: and(eq(newsTable.slug, slug), ne(newsTable.id, input.id)),
      });

      if (clash) {
        throw new Error("Another article already uses this title.");
      }

      const [updated] = await db
        .get()
        .update(newsTable)
        .set({
          slug,
          title: input.title,
          date: input.date,
          coverImage: input.coverImage || null,
          content: input.content,
        })
        .where(eq(newsTable.id, input.id))
        .returning();

      return updated;
    }),

  newsDelete: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      await db.get().delete(newsTable).where(eq(newsTable.id, input.id));
      return { success: true };
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

  // ---- fixtures -----------------------------------------------------------

  getFixtures: publicProcedure.query(async () => {
    const active = await findActiveCompetition();

    if (!active) {
      return [];
    }

    const matches = await db.get().query.matchTable.findMany({
      where: eq(matchTable.competitionId, active.id),
      orderBy: [asc(matchTable.round), asc(matchTable.kickoffAt), asc(matchTable.id)],
      with: {
        homeTeam: { columns: { id: true, teamName: true, color: true } },
        awayTeam: { columns: { id: true, teamName: true, color: true } },
      },
    });

    return matches.map(matchToDto);
  }),

  fixtureCreate: protectedProcedure
    .input(
      z.object({
        homeTeamId: z.number().int().min(1),
        awayTeamId: z.number().int().min(1),
        round: z.number().int().min(1),
        kickoffAt: z.string().trim().min(1),
        prizeLabel: z.string().trim().optional().default(DEFAULT_PRIZE_LABEL),
      })
    )
    .mutation(async ({ input }) => {
      const active = await requireActiveCompetition();

      if (input.homeTeamId === input.awayTeamId) {
        throw new Error("Home and away teams cannot be the same.");
      }

      const [homeTeam, awayTeam] = await Promise.all([
        db.get().query.teamsTable.findFirst({ where: eq(teamsTable.id, input.homeTeamId) }),
        db.get().query.teamsTable.findFirst({ where: eq(teamsTable.id, input.awayTeamId) }),
      ]);

      if (!homeTeam || !awayTeam) {
        throw new Error("Team not found.");
      }

      if (homeTeam.competitionId !== active.id || awayTeam.competitionId !== active.id) {
        throw new Error("Both teams must belong to the active competition.");
      }

      const kickoff = new Date(input.kickoffAt);
      if (Number.isNaN(kickoff.getTime())) {
        throw new Error("A valid kickoff date and time is required.");
      }

      const [fixture] = await db
        .get()
        .insert(matchTable)
        .values({
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
          round: input.round,
          kickoffAt: kickoff,
          matchDate: formatMatchDate(kickoff.toISOString()),
          prizeLabel: input.prizeLabel || DEFAULT_PRIZE_LABEL,
          status: "scheduled",
          competitionId: active.id,
          homeGoals: null,
          awayGoals: null,
        })
        .returning();

      return matchToDto(fixture);
    }),

  fixtureUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number().int().min(1),
        homeTeamId: z.number().int().min(1),
        awayTeamId: z.number().int().min(1),
        round: z.number().int().min(1),
        kickoffAt: z.string().trim().min(1),
        prizeLabel: z.string().trim().optional().default(DEFAULT_PRIZE_LABEL),
      })
    )
    .mutation(async ({ input }) => {
      const active = await requireActiveCompetition();

      const fixture = await db.get().query.matchTable.findFirst({
        where: eq(matchTable.id, input.id),
      });

      if (!fixture) {
        throw new Error("Fixture not found.");
      }

      if (fixture.competitionId !== active.id) {
        throw new Error("This fixture belongs to an archived competition.");
      }

      if (fixture.status === "final") {
        if (fixture.homeTeamId !== input.homeTeamId || fixture.awayTeamId !== input.awayTeamId) {
          throw new Error("Cannot change the teams after the match has been played.");
        }
      }

      const kickoff = new Date(input.kickoffAt);
      if (Number.isNaN(kickoff.getTime())) {
        throw new Error("A valid kickoff date and time is required.");
      }

      const [updated] = await db
        .get()
        .update(matchTable)
        .set({
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
          round: input.round,
          kickoffAt: kickoff,
          matchDate: formatMatchDate(kickoff.toISOString()),
          prizeLabel: input.prizeLabel || DEFAULT_PRIZE_LABEL,
        })
        .where(eq(matchTable.id, input.id))
        .returning();

      return matchToDto(updated);
    }),

  fixtureDelete: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      const active = await requireActiveCompetition();

      const fixture = await db.get().query.matchTable.findFirst({
        where: eq(matchTable.id, input.id),
      });

      if (!fixture) {
        throw new Error("Fixture not found.");
      }

      if (fixture.competitionId !== active.id) {
        throw new Error("This fixture belongs to an archived competition.");
      }

      if (fixture.status === "final") {
        throw new Error(
          "Cannot delete a played fixture - its result is already in the standings. Correct the result on the Scores page instead."
        );
      }

      await db.get().delete(matchTable).where(eq(matchTable.id, input.id));

      return { success: true };
    }),

  // ---- match results ------------------------------------------------------

  recordMatchScores: protectedProcedure
    .input(
      z.object({
        matchId: z.number().int().min(1),
        homeGoals: z.number().int().min(0),
        awayGoals: z.number().int().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const active = await requireActiveCompetition();

      const fixture = await db.get().query.matchTable.findFirst({
        where: eq(matchTable.id, input.matchId),
      });

      if (!fixture) {
        throw new Error("Fixture not found.");
      }

      if (fixture.competitionId !== active.id) {
        throw new Error("This fixture belongs to an archived competition.");
      }

      if (!fixture.homeTeamId || !fixture.awayTeamId) {
        throw new Error("Fixture teams are not set.");
      }

      // Rewind a previously recorded result before applying the new one, so
      // correcting a score stays consistent with the standings. Only reverse
      // when this fixture's points were actually applied (seeded historical
      // fixtures carry scores but were never counted toward this competition).
      if (fixture.pointsRecorded && fixture.homeGoals != null && fixture.awayGoals != null) {
        await applyMatchPoints(
          active.id,
          fixture.homeTeamId,
          fixture.awayTeamId,
          fixture.homeGoals,
          fixture.awayGoals,
          -1
        );
      }

      await applyMatchPoints(
        active.id,
        fixture.homeTeamId,
        fixture.awayTeamId,
        input.homeGoals,
        input.awayGoals,
        1
      );

      await db
        .get()
        .update(matchTable)
        .set({
          homeGoals: input.homeGoals,
          awayGoals: input.awayGoals,
          status: "final",
          pointsRecorded: true,
        })
        .where(eq(matchTable.id, input.matchId));

      await settleMatch(input.matchId);

      return { fixtureId: fixture.id, status: "final" as const };
    }),

  // ---- predictions --------------------------------------------------------

  predictionSubmit: publicProcedure
    .input(
      z.object({
        matchId: z.number().int().min(1),
        playerName: z.string().trim().min(1),
        homeGoals: z.number().int().min(0).max(50),
        awayGoals: z.number().int().min(0).max(50),
      })
    )
    .mutation(async ({ input }) => {
      const active = await findActiveCompetition();

      if (!active) {
        throw new Error("No active competition.");
      }

      const match = await db.get().query.matchTable.findFirst({
        where: eq(matchTable.id, input.matchId),
      });

      if (!match) {
        throw new Error("Match not found.");
      }

      if (match.competitionId !== active.id) {
        throw new Error("This match belongs to an archived competition.");
      }

      if (match.status === "final") {
        throw new Error("This match has already been played.");
      }

      if (!match.kickoffAt || new Date(match.kickoffAt).getTime() <= Date.now()) {
        throw new Error("Predictions are closed for this match.");
      }

      const playerName = normalizeName(input.playerName);

      const participants = await db.get().query.playersTable.findMany({
        where: eq(playersTable.competitionId, active.id),
      });
      const participant =
        participants.find(
          (player) => player.playerName.toLowerCase() === playerName.toLowerCase()
        ) ?? null;
      const eligible = Boolean(participant);

      const existingEntries = await db.get().query.predictionEntriesTable.findMany({
        where: eq(predictionEntriesTable.matchId, input.matchId),
      });

      const alreadySubmitted =
        existingEntries.some((entry) =>
          participant ? entry.playerId === participant.id : false
        ) ||
        existingEntries.some(
          (entry) => entry.playerName.toLowerCase() === playerName.toLowerCase()
        );

      if (alreadySubmitted) {
        throw new Error("You have already submitted a prediction for this match.");
      }

      await db.get().insert(predictionEntriesTable).values({
        matchId: input.matchId,
        playerId: participant?.id ?? null,
        playerName,
        guessedHomeGoals: input.homeGoals,
        guessedAwayGoals: input.awayGoals,
        eligible,
        status: "open",
      });

      return { success: true, eligible, playerName };
    }),

  getMatchPredictions: publicProcedure
    .input(z.object({ matchId: z.number().int().min(1) }))
    .query(async ({ input }) => {
      const match = await db.get().query.matchTable.findFirst({
        where: eq(matchTable.id, input.matchId),
        with: {
          homeTeam: { columns: { id: true, teamName: true, color: true } },
          awayTeam: { columns: { id: true, teamName: true, color: true } },
        },
      });

      if (!match) {
        throw new Error("Match not found.");
      }

      const entries = await db.get().query.predictionEntriesTable.findMany({
        where: eq(predictionEntriesTable.matchId, input.matchId),
        orderBy: [asc(predictionEntriesTable.submittedAt)],
      });

      return {
        match: matchToDto(match),
        entries: entries.map((entry) => ({
          id: entry.id,
          playerName: entry.playerName,
          homeGoals: entry.guessedHomeGoals,
          awayGoals: entry.guessedAwayGoals,
          eligible: entry.eligible,
          status: entry.status,
          prizeClaimed: entry.prizeClaimed,
          submittedAt: entry.submittedAt.toISOString(),
        })),
        winner: entries.find((entry) => entry.status === "won") ?? null,
      };
    }),

  settleMatch: protectedProcedure
    .input(z.object({ matchId: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      return settleMatch(input.matchId);
    }),

  matchPredictionsList: protectedProcedure
    .input(z.object({ matchId: z.number().int().min(1) }))
    .query(async ({ input }) => {
      const match = await db.get().query.matchTable.findFirst({
        where: eq(matchTable.id, input.matchId),
        with: {
          homeTeam: { columns: { id: true, teamName: true, color: true } },
          awayTeam: { columns: { id: true, teamName: true, color: true } },
        },
      });

      if (!match) {
        throw new Error("Match not found.");
      }

      const entries = await db.get().query.predictionEntriesTable.findMany({
        where: eq(predictionEntriesTable.matchId, input.matchId),
        orderBy: [asc(predictionEntriesTable.submittedAt)],
      });

      return {
        match: matchToDto(match),
        entries: entries.map((entry) => ({
          id: entry.id,
          matchId: entry.matchId,
          playerId: entry.playerId,
          playerName: entry.playerName,
          guessedHomeGoals: entry.guessedHomeGoals,
          guessedAwayGoals: entry.guessedAwayGoals,
          eligible: entry.eligible,
          status: entry.status,
          prizeClaimed: entry.prizeClaimed,
          submittedAt: entry.submittedAt.toISOString(),
          createdAt: entry.createdAt.toISOString(),
        })),
      };
    }),

  setPrizeClaimed: protectedProcedure
    .input(z.object({ entryId: z.number().int().min(1), prizeClaimed: z.boolean() }))
    .mutation(async ({ input }) => {
      const entry = await db.get().query.predictionEntriesTable.findFirst({
        where: eq(predictionEntriesTable.id, input.entryId),
      });

      if (!entry) {
        throw new Error("Prediction not found.");
      }

      if (entry.status !== "won") {
        throw new Error("Only the winning prediction can be marked as claimed.");
      }

      await db
        .get()
        .update(predictionEntriesTable)
        .set({ prizeClaimed: input.prizeClaimed })
        .where(eq(predictionEntriesTable.id, input.entryId));

      return { success: true };
    }),

  // ---- team of the week ---------------------------------------------------

  getTeamOfTheWeek: publicProcedure
    .input(z.object({ competitionId: z.number().int().optional() }).optional())
    .query(async ({ input }) => {
      const competitionId = await resolveCompetitionId(input?.competitionId);

      if (!competitionId) {
        return null;
      }

      const playerWithTeam = { with: { team: true } } as const;

      const totw = await db.get().query.teamOfTheWeekTable.findFirst({
        where: eq(teamOfTheWeekTable.competitionId, competitionId),
        with: {
          competition: true,
          defenderOne: playerWithTeam,
          defenderTwo: playerWithTeam,
          midfielder: playerWithTeam,
          forwardOne: playerWithTeam,
          forwardTwo: playerWithTeam,
          subOne: playerWithTeam,
          subTwo: playerWithTeam,
          subThree: playerWithTeam,
          subFour: playerWithTeam,
        },
      });

      return totw ? teamOfTheWeekToDto(totw) : null;
    }),

  upsertTeamOfTheWeek: protectedProcedure
    .input(
      z.object({
        weekLabel: z.string().trim().optional().default(""),
        defenderOneId: z.number().int().min(1).nullish(),
        defenderTwoId: z.number().int().min(1).nullish(),
        midfielderId: z.number().int().min(1).nullish(),
        forwardOneId: z.number().int().min(1).nullish(),
        forwardTwoId: z.number().int().min(1).nullish(),
        subOneId: z.number().int().min(1).nullish(),
        subTwoId: z.number().int().min(1).nullish(),
        subThreeId: z.number().int().min(1).nullish(),
        subFourId: z.number().int().min(1).nullish(),
      })
    )
    .mutation(async ({ input }) => {
      const active = await requireActiveCompetition();

      const playerIds = [
        input.defenderOneId,
        input.defenderTwoId,
        input.midfielderId,
        input.forwardOneId,
        input.forwardTwoId,
        input.subOneId,
        input.subTwoId,
        input.subThreeId,
        input.subFourId,
      ].filter((id): id is number => typeof id === "number");

      if (playerIds.length > 0) {
        const found = await db
          .get()
          .select({ id: playersTable.id, competitionId: playersTable.competitionId })
          .from(playersTable)
          .where(inArray(playersTable.id, playerIds));

        if (found.length !== playerIds.length) {
          throw new Error("One or more selected players could not be found.");
        }

        if (found.some((player) => player.competitionId !== active.id)) {
          throw new Error("All selected players must belong to the active competition.");
        }
      }

      const values = {
        competitionId: active.id,
        weekLabel: input.weekLabel || null,
        defenderOneId: input.defenderOneId ?? null,
        defenderTwoId: input.defenderTwoId ?? null,
        midfielderId: input.midfielderId ?? null,
        forwardOneId: input.forwardOneId ?? null,
        forwardTwoId: input.forwardTwoId ?? null,
        subOneId: input.subOneId ?? null,
        subTwoId: input.subTwoId ?? null,
        subThreeId: input.subThreeId ?? null,
        subFourId: input.subFourId ?? null,
      };

      const existing = await db.get().query.teamOfTheWeekTable.findFirst({
        where: eq(teamOfTheWeekTable.competitionId, active.id),
      });

      if (existing) {
        await db
          .get()
          .update(teamOfTheWeekTable)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(teamOfTheWeekTable.id, existing.id));
      } else {
        await db.get().insert(teamOfTheWeekTable).values(values);
      }

      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
