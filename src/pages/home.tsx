import { useState, useMemo, useEffect } from "react";
import { trpc } from "../client/trpc";
import { Link } from "react-router";
import { Jersey } from "../components/Jersey";
import { TeamOfTheWeekPitch } from "../components/TeamOfTheWeekPitch";
import { teamColors } from "../lib/teamColors";
import { PredictCard } from "../components/PredictCard";
import { formatKickoff, isFixtureOpen, type FixtureDto } from "../lib/fixtures";

export function HomePage() {
  const [activeTab, setActiveTab] = useState<"team" | "players">("team");
  const [newsItemsToShow, setNewsItemsToShow] = useState(2);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const ONE_HOUR = 60 * 60 * 1000;

  const utils = trpc.useUtils();

  useEffect(() => {
    utils.competitionsList.prefetch();
  }, [utils]);

  const { data: teams = [] } = trpc.getTeams.useQuery(undefined, {
    staleTime: ONE_HOUR,
  });
  const { data: matches = [] } = trpc.getFixtures.useQuery(undefined, {
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
  const { data: players } = trpc.getPlayers.useQuery(undefined, {
    staleTime: ONE_HOUR,
  });
  const { data: activeCompetition } = trpc.getActiveCompetition.useQuery(undefined, {
    staleTime: ONE_HOUR,
  });
  const { data: newsItems = [] } = trpc.newsList.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const { data: teamOfTheWeek } = trpc.getTeamOfTheWeek.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  //pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage] = useState(6);

  //calculate index
  const lastPageIndex = currentPage * itemsPerPage;
  const startPageIndex = lastPageIndex - itemsPerPage;

  //sort players data
  const sortedPlayers = [...(players || [])].sort((a, b) => {
    if (b.goals !== a.goals) {
      return b.goals - a.goals;
    }
    if (b.assists !== a.assists) {
      return b.assists - a.assists;
    }
    if (b.yellowCard !== a.yellowCard) {
      return b.yellowCard - a.yellowCard;
    }
    return b.redCard - a.redCard;
  });

  const currentPageIndex = sortedPlayers?.slice(startPageIndex, lastPageIndex);

  console.log({ currentPageIndex });

  //calculate total pages
  const totalPages = Math.ceil(players ? players?.length / itemsPerPage : 0);

  //function that handles change of page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  //sort teams
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      return (b.score?.points ?? 0) - (a.score?.points ?? 0);
    });
  }, [teams]);

  // const getTeamColor = (teamId: number) => {
  //   const team = teams?.find((team) => team.id === teamId);
  //   return team ? team.color : "gray";
  // };

  const handleLoadMoreNews = () => {
    setNewsItemsToShow(newsItems.length);
  };

  const handleLoadLessNews = () => {
    setNewsItemsToShow(2);
  };

  const weekRounds = useMemo(() => {
    const byRound = new Map<number, FixtureDto[]>();
    for (const match of matches) {
      if (match.round == null) continue;
      const list = byRound.get(match.round) ?? [];
      list.push(match);
      byRound.set(match.round, list);
    }
    return [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, fixtures]) => ({
        round,
        matchDate: fixtures[0]?.matchDate ?? "",
        matches: fixtures,
      }));
  }, [matches]);

  useEffect(() => {
    if (weekRounds.length === 0) return;
    const openIndex = weekRounds.findIndex((week) =>
      week.matches.some((match) => isFixtureOpen(match))
    );
    setCurrentWeekIndex(openIndex === -1 ? weekRounds.length - 1 : openIndex);
  }, [weekRounds]);

  const currentWeek = weekRounds[currentWeekIndex];
  const openThisWeek = currentWeek?.matches.filter((match) => isFixtureOpen(match)) ?? [];
  const hasOpenMatches = matches.some((match) => isFixtureOpen(match));

  const renderMatch = (fixture: FixtureDto, key: number) => {
    const homeName = fixture.homeTeam?.teamName ?? `Team ${fixture.homeTeamId ?? "?"}`;
    const awayName = fixture.awayTeam?.teamName ?? `Team ${fixture.awayTeamId ?? "?"}`;
    const homePalette = teamColors(fixture.homeTeam?.color);
    const awayPalette = teamColors(fixture.awayTeam?.color);

    const hasScores = fixture.homeGoals != null && fixture.awayGoals != null;

    return (
      <li
        key={key}
        className="bg-[#f8f0ed] border-2 border-dashed border-[#62381d] rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-10 w-full">
          <Link
            to={`/teams/${encodeURIComponent(homeName.replace(/\s/g, ""))}`}
            className="flex flex-col items-center gap-2 w-24 sm:w-32 group"
          >
            <Jersey
              primary={homePalette.primary}
              secondary={homePalette.secondary}
              badge={homeName.slice(-1)}
              className="w-20 sm:w-24 drop-shadow-md transition-transform group-hover:-rotate-2 group-hover:scale-105"
            />
            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#62381d]/10 text-[#62381d] rounded-full px-2 py-0.5">
              Home
            </span>
            <p className="font-bold text-sm sm:text-base text-center leading-tight">{homeName}</p>
          </Link>

          <div className="text-center">
            {hasScores ? (
              <p className="text-2xl sm:text-3xl font-black text-[#62381d]">
                {fixture.homeGoals} - {fixture.awayGoals}
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-black text-[#62381d]/60">VS</p>
            )}
            <p className="text-xs font-semibold text-[#62381d]/70 mt-1">
              {formatKickoff(fixture)}
            </p>
          </div>

          <Link
            to={`/teams/${encodeURIComponent(awayName.replace(/\s/g, ""))}`}
            className="flex flex-col items-center gap-2 w-24 sm:w-32 group"
          >
            <Jersey
              primary={awayPalette.primary}
              secondary={awayPalette.secondary}
              badge={awayName.slice(-1)}
              className="w-20 sm:w-24 drop-shadow-md transition-transform group-hover:rotate-2 group-hover:scale-105"
            />
            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#62381d]/10 text-[#62381d] rounded-full px-2 py-0.5">
              Away
            </span>
            <p className="font-bold text-sm sm:text-base text-center leading-tight">{awayName}</p>
          </Link>
        </div>
      </li>
    );
  };

  return (
    <section className=" flex flex-col gap-6  pb-20 bg-[#fff]">
      <section className="[background:url('/cityclub3.jpg')] relative h-[30rem] [background-position:center] bg_pics w-full">
        <span className="block absolute top-0 bg-black/50 h-full w-full"></span>
        <div className="relative flex flex-col justify-center items-center h-full mx-6 text-center">
          <p className="bg-white/30 py-1 px-2 text-sm rounded-2xl text-left">News update⚡️</p>
          <h2 className="text-3xl font-bold">
            ✨Final showdown!!!✨
            <br /> Who will be crowned champion in the City Club League Championship 🏆
          </h2>
          {/* <div className="flex flex-col gap-2 font-semibold text-balance">
            <p>Team D lost their spot at the top of the league! </p>
          </div> */}
        </div>
      </section>

      <section className="mx-6 md:w-[70vw] md:mx-auto flex flex-row flex-wrap items-center justify-between gap-4 text-[brown]">
        <p className="font-semibold">
          🏆 {activeCompetition?.name ?? "No active competition"}
        </p>
        <Link to="/history" className="text-sm underline hover:no-underline">
          View competition history →
        </Link>
      </section>

      <section className="mx-6 mt-20 md:w-[70vw] md:mx-auto ">
        <h3 className="text-xl font-bold text-black">Latest news</h3>
        <ul className=" space-y-6  mt-6">
          {newsItems.slice(0, newsItemsToShow).map((item, index) => (
            <li className="group newsbg relative" key={index}>
              <Link
                key={item.slug}
                to={`/news/${item.slug}`}
                className="flex flex-row gap-4  bg-[#f8f0ed] p-3 hover:bg-[#fac4a3] rounded-lg group "
              >
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt=""
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No img</span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-black group-hover:text-slate-700">
                    {item.title}
                  </h4>
                  {item.date && (
                    <p className="text-sm text-gray-500 mt-0.5">{item.date}</p>
                  )}
                  <p className="text-sm text-orange-500 mt-1 group-hover:text-orange-700">
                    Read more →
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex justify-center gap-4 mt-6 text-black">
          {newsItemsToShow < newsItems.length && (
            <button
              onClick={handleLoadMoreNews}
              className="text-center px-4 py-2 hover:font-bold cursor-pointer"
            >
              Load more..
            </button>
          )}
          {newsItemsToShow > 2 && (
            <button
              onClick={handleLoadLessNews}
              className="text-center px-4 py-2 hover:font-bold cursor-pointer"
            >
              ...Load less
            </button>
          )}
        </div>
      </section>

      <section className="mt-20 mx-6 md:w-[70vw] md:mx-auto text-black">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Fixtures</h3>
          <div className="flex items-center gap-4">
            <button
              className="p-2 flex w-11 h-11 items-center justify-center font-bold rounded-full cursor-pointer bg-[#fac4a3] border-2 border-dashed border-[brown] text-[brown] hover:font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="previous fixture week"
              disabled={weekRounds.length === 0}
              onClick={() =>
                setCurrentWeekIndex(
                  currentWeekIndex === 0 ? weekRounds.length - 1 : currentWeekIndex - 1
                )
              }
            >
              ←
            </button>
            <p className="font-semibold">
              {weekRounds.length > 0
                ? `Match week ${currentWeek?.round ?? "-"}`
                : "No fixtures yet"}
            </p>
            <button
              aria-label="next fixture week"
              className="p-2 flex w-11 h-11 items-center justify-center font-bold rounded-full cursor-pointer bg-[#fac4a3] border-2 border-dashed border-[brown] text-[brown] hover:font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={weekRounds.length === 0}
              onClick={() =>
                setCurrentWeekIndex(
                  currentWeekIndex === weekRounds.length - 1 ? 0 : currentWeekIndex + 1
                )
              }
            >
              →
            </button>
          </div>
        </div>

        <div className="text-center my-5 text-lg font-semibold">{currentWeek?.matchDate}</div>

        {currentWeek ? (
          <>
            <ul className="grid sm:grid-cols-2 gap-6">
              {currentWeek.matches.map((match, index) => renderMatch(match, index))}
            </ul>

            {openThisWeek.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-bold">Predict &amp; Win</h4>
                  <Link to="/predict" className="text-sm underline hover:no-underline">
                    All predictions →
                  </Link>
                </div>
                <ul className="grid sm:grid-cols-2 gap-6 mt-4">
                  {openThisWeek.map((match) => (
                    <li key={match.id}>
                      <PredictCard match={match} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!hasOpenMatches && (
              <div className="mt-8 bg-[#f8f0ed] border-2 border-dashed border-[#62381d] rounded-2xl px-5 py-6 text-center">
                <p className="font-bold text-[#62381d]">
                  🎯 Predict &amp; Win {matches[0]?.prizeLabel ?? ""}
                </p>
                <p className="text-sm text-[#62381d]/80 mt-2">
                  Guess the exact score of a fixture to win the airtime prize. Be the first
                  eligible player to match the score — new predictions open when the next fixture
                  is scheduled.
                </p>
                <Link
                  to="/predict"
                  className="inline-block mt-4 bg-[#62381d] text-[#f8f0ed] font-bold rounded-lg px-4 py-2"
                >
                  Go to Predictions
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-[#62381d]/70 py-10">
            No fixtures scheduled for the active competition yet.
          </p>
        )}
      </section>

      {teamOfTheWeek && (
        <section className="mb-20 mt-20 mx-6 md:w-[70vw] md:mx-auto text-black">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold">🏆 Team of the Week</h3>
            <Link to="/totw" className="text-sm underline hover:no-underline">
              View full squad →
            </Link>
          </div>
          <TeamOfTheWeekPitch teamOfTheWeek={teamOfTheWeek} compact />
        </section>
      )}

      <section className=" mb-20 mt-20 mx-6 md:w-[70vw] md:mx-auto">
        <h3 className="text-xl font-bold text-black">Team and player stats</h3>
        {/* Tab Pills */}
        <div className="flex border-b border-gray-200 mb-4 mt-6">
          <button
            className={`px-4 py-2 font-bold text-sm w-full cursor-pointer ${
              activeTab === "team" ? " bg-[#f8f0ed] text-[brown] border-b-2" : "text-[brown]  "
            }`}
            onClick={() => setActiveTab("team")}
          >
            Team Table
          </button>
          <button
            className={`px-4 py-2 font-bold text-sm w-full cursor-pointer ${
              activeTab === "players" ? "bg-[#f8f0ed] text-[brown] border-b-2" : "text-[brown] "
            }`}
            onClick={() => setActiveTab("players")}
          >
            Players Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "team" ? (
          <div className="overflow-x-auto">
            <table className="w-full mb-6">
              <thead className="text-sm font-bold text-black">
                <tr>
                  <td className="px-3 py-2">Pos</td>
                  <td className="px-3 py-2">Team</td>
                  <td className="px-3 py-2">P</td>
                  <td className="px-3 py-2">W</td>
                  <td className="px-3 py-2">L</td>
                  <td className="px-3 py-2">D</td>
                  <td className="px-3 py-2">GF+</td>
                  <td className="px-3 py-2">GA-</td>
                  <td className="px-3 py-2">GD+/-</td>
                  <td className="px-3 py-2">PTS</td>
                </tr>
              </thead>

              <tbody>
                {sortedTeams && sortedTeams.length > 0 ? (
                  sortedTeams.map((team, idx) => (
                    <tr key={team.id} className="odd:bg-[#f8f0ed]  text-[brown] font-bold">
                      <td className="px-3 py-4">{idx + 1}</td>
                      <td className="px-3 py-4 text-nowrap">{team.teamName}</td>
                      <td className="px-3 py-4">{team.score.gamesPlayed}</td>
                      <td className="px-3 py-4">{team.score.gamesWon}</td>
                      <td className="px-3 py-4">{team.score.gamesLost}</td>
                      <td className="px-3 py-4">{team.score.gamesDrawn}</td>
                      <td className="px-3 py-4">{team.score.goalsFor}</td>
                      <td className="px-3 py-4">{team.score.goalsAgainst}</td>
                      <td className="px-3 py-4">{team.score.goalDifference}</td>
                      <td className="px-3 py-4">{team.score.points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>No table list to display yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <section>
            <div className="overflow-x-auto ">
              <table className="w-full mb-6 ">
                <thead className="w-full text-sm font-bold text-black">
                  <tr>
                    <td className="px-4 py-2">No</td>
                    <td className="px-4 py-2">Name</td>
                    <td className="px-4 py-2">⚽️</td>
                    <td className="px-4 py-2">👟</td>
                    <td className="px-4 py-2">🟨</td>
                    <td className="px-4 py-2">🟥</td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </thead>
                <tbody>
                  {currentPageIndex && currentPageIndex.length > 0 ? (
                    currentPageIndex.map((player, idx) => (
                      <tr key={player.id} className="odd:bg-[#f8f0ed]  text-[brown] font-bold">
                        <td className="p-4">{startPageIndex + idx + 1}</td>
                        <td className="p-4">{player.playerName}</td>
                        <td className="p-4">{player.goals}</td>
                        <td className="p-4">{player.assists}</td>
                        <td className="p-4">{player.yellowCard}</td>
                        <td className="p-4">{player.redCard}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td>No players stats to display yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="w-full  flex flex-row justify-between items-center  mt-6  ">
              <div className="flex flex-row gap-2 text-sm text-[brown]">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                  prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className="bg-[#f8f0ed] hover:bg-[brown] hover:text-[#f8f0ed] cursor-pointer font-semibold px-3 py-1 rounded-sm"
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  next
                </button>
              </div>
              <div>
                <p className="hidden md:flex">
                  Pages {currentPage}/{totalPages}
                </p>
              </div>
            </div>
          </section>
        )}
      </section>

      {/* <section>Rules and Regulations</section> */}
    </section>
  );
}

export default HomePage;
