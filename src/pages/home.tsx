import { useState, useMemo } from "react";
import { trpc } from "../client/trpc";
import { Link } from "react-router";

interface Match {
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
}

const TEAM_COLORS = {
  TeamA: { bg: "bg-red-200", text: "text-red-500" },
  TeamB: { bg: "bg-blue-200", text: "text-blue-500" },
  TeamC: { bg: "bg-green-200", text: "text-green-500" },
  TeamD: { bg: "bg-orange-200", text: "text-orange-500" },
};

const newsModules = import.meta.glob("../news-content/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function extractTitleFromMarkdown(content: string): string {
  //get first # heading
  const headingMatch = content?.match(/^#\s+(.*)/m);
  if (headingMatch) return headingMatch[1].trim();

  return "Untitled News";
}

function extractImageFromMarkdown(content: string): string | null {
  // Match Markdown image syntax: ![alt](src)
  const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
  if (imageMatch) {
    let src = imageMatch[1].trim();

    return src;
  }
  return null;
}

const newsItems = Object.entries(newsModules).map(([path, content]) => {
  const filename = path.split("/").pop()!; // e.g., "thrilling-victory.md"
  const slug = filename.replace(/\.md$/, ""); // e.g., "thrilling-victory"
  const title = extractTitleFromMarkdown(content as string);
  const image = extractImageFromMarkdown(content as string);

  return { slug, path, title, image };
});

export function HomePage() {
  const [currentFixtureIndex, setCurrentFixtureIndex] = useState(14);
  const [matchWeekCount, setMatchWeekCount] = useState(8);
  const [activeTab, setActiveTab] = useState<"team" | "players">("team");
  const [newsItemsToShow, setNewsItemsToShow] = useState(2);

  const ONE_HOUR = 60 * 60 * 1000;

  const { data: teams = [] } = trpc.getTeams.useQuery(undefined, {
    staleTime: ONE_HOUR,
  });
  const { data: players } = trpc.getPlayers.useQuery(undefined, {
    staleTime: ONE_HOUR,
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

  const matchFixtures = [
    {
      homeTeam: "TeamA",
      awayTeam: "TeamC",
      startTime: "7:30am",
      homeScore: 1,
      awayScore: 2,
      date: "21 Sept, 2025",
    },
    {
      homeTeam: "TeamB",
      awayTeam: "TeamD",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 1,
      date: "21 Sept, 2025",
    },
    {
      homeTeam: "TeamA",
      awayTeam: "TeamB",
      startTime: "7:30am",
      homeScore: 2,
      awayScore: 1,
      date: "28 Sept, 2025",
    },
    {
      homeTeam: "TeamC",
      awayTeam: "TeamD",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 1,
      date: "28 Sept, 2025",
    },
    {
      homeTeam: "TeamA",
      awayTeam: "TeamD",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 0,
      date: "5 Oct, 2025",
    },
    {
      homeTeam: "TeamB",
      awayTeam: "TeamC",
      startTime: "7:30am",
      homeScore: 4,
      awayScore: 1,
      date: "5 Oct, 2025",
    },
    {
      homeTeam: "TeamC",
      awayTeam: "TeamA",
      startTime: "7:30am",
      homeScore: 1,
      awayScore: 0,
      date: "12 Oct, 2025",
    },
    {
      homeTeam: "TeamB",
      awayTeam: "TeamD",
      startTime: "7:30am",
      homeScore: 2,
      awayScore: 0,
      date: "12 Oct, 2025",
    },
    {
      homeTeam: "TeamB",
      awayTeam: "TeamA",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 0,
      date: "19 Oct, 2025",
    },
    {
      homeTeam: "TeamD",
      awayTeam: "TeamC",
      startTime: "7:30am",
      homeScore: 1,
      awayScore: 0,
      date: "19 Oct, 2025",
    },
    {
      homeTeam: "TeamD",
      awayTeam: "TeamA",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 0,
      date: "26 Oct, 2025",
    },
    {
      homeTeam: "TeamC",
      awayTeam: "TeamB",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 0,
      date: "26 Oct, 2025",
    },
    {
      homeTeam: "TeamC",
      awayTeam: "TeamA",
      startTime: "7:30am",
      homeScore: 0,
      awayScore: 1,
      date: "2 Nov, 2025",
    },
    {
      homeTeam: "TeamB",
      awayTeam: "TeamD",
      startTime: "7:30am",
      homeScore: 2,
      awayScore: 1,
      date: "2 Nov, 2025",
    },
    {
      homeTeam: "TeamB",
      awayTeam: "TeamA",
      startTime: "7:30am",
      homeScore: null,
      awayScore: null,
      date: "9 Nov, 2025",
    },
    {
      homeTeam: "TeamD",
      awayTeam: "TeamC",
      startTime: "7:30am",
      homeScore: null,
      awayScore: null,
      date: "9 Nov, 2025",
    },
    {
      homeTeam: "TeamD",
      awayTeam: "TeamA",
      startTime: "7:30am",
      homeScore: null,
      awayScore: null,
      date: "16 Nov, 2025",
    },
    {
      homeTeam: "TeamC",
      awayTeam: "TeamB",
      startTime: "7:30am",
      homeScore: null,
      awayScore: null,
      date: "16 nov, 2025",
    },
  ];

  const totalWeeks = Math.ceil(matchFixtures.length / 2); // = 3

  const renderMatch = (match: Match, key: number) => {
    const homeColor = TEAM_COLORS[match.homeTeam as keyof typeof TEAM_COLORS] || {
      bg: "bg-gray-500",
      text: "text-white",
    };
    const awayColor = TEAM_COLORS[match.awayTeam as keyof typeof TEAM_COLORS] || {
      bg: "bg-gray-500",
      text: "text-white",
    };

    const hasScores = match.homeScore != null && match.awayScore != null;

    return (
      <li key={key} className="w-full flex flex-col justify-center items-center">
        <p className="flex gap-6 items-center">
          <Link
            to={`/teams/${encodeURIComponent(match.homeTeam)}`}
            className={`block p-6 font-bold cursor-pointer dark:bg-[#ffffd9] bg-[#FFFFB8] shadow-md shadow-accent h-max -rotate-6 hover:rotate-0 relative ${homeColor.text}`}
          >
            <span className="bg-[brown] block absolute -top-2 left-7 w-10 h-3"></span>
            {match.homeTeam}
          </Link>

          {hasScores ? (
            <span className="text-xl font-bold block text-nowrap">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-xl">Vs</span>
          )}

          <Link
            to={`/teams/${encodeURIComponent(match.awayTeam)}`}
            className={`block p-6 font-bold cursor-pointer dark:bg-[#ffffd9] bg-[#FFFFB8] shadow-md shadow-accent rotate-6 hover:rotate-0 relative ${awayColor.text}`}
          >
            <span className="bg-[brown] block absolute -top-2 left-7 w-10 h-3"></span>
            {match.awayTeam}
          </Link>
        </p>
        <p>{match.startTime}</p>
      </li>
    );
  };

  return (
    <section className=" flex flex-col gap-6  pb-20 bg-[#fff]">
      <section className="[background:url('/cityclub1.jpg')] relative h-[30rem] [background-position:center] bg_pics w-full">
        <span className="block absolute top-0 bg-black/50 h-full w-full"></span>
        <div className="relative flex flex-col justify-center items-center h-full mx-6 text-center gap-6">
          <h2 className="text-3xl font-bold">TeamB defeated TeamD to claim top spot! 😩</h2>
          {/* <div className="flex flex-col gap-2 font-semibold text-balance">
            <p>Team D lost their spot at the top of the league! </p>
          </div> */}
        </div>
      </section>

      <section className="mx-6 mt-32 md:w-[70vw] md:mx-auto ">
        <h3 className="text-xl font-bold text-black">Latest news</h3>
        <ul className=" space-y-6  mt-6">
          {newsItems.slice(0, newsItemsToShow).map((item, index) => (
            <li className="group newsbg relative" key={index}>
              <Link
                key={item.slug}
                to={`/news/${item.slug}`}
                className="flex flex-row gap-4  bg-[#f8f0ed] p-3 hover:bg-[#fac4a3] rounded-lg group "
              >
                {item.image ? (
                  <img
                    src={item.image}
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

      <section className="mt-32 mx-6 md:w-[70vw] md:mx-auto text-black">
        <h3 className="text-xl font-bold ">Fixtures</h3>
        <div className="flex justify-center items-center gap-4 mt-6 ">
          <button
            className=" p-2 flex w-12 h-12  items-center justify-center font-bold rounded-full cursor-pointer bg-[#fac4a3] border-2 border-dashed border-[brown] text-[brown] hover:font-bold"
            aria-label="prev-button"
            onClick={() => {
              if (currentFixtureIndex === 0) {
                // Go to last week
                setCurrentFixtureIndex(matchFixtures.length - 2); // 6 - 2 = 4
                setMatchWeekCount(totalWeeks); // 3
              } else {
                setCurrentFixtureIndex(currentFixtureIndex - 2);
                setMatchWeekCount(matchWeekCount - 1);
              }
            }}
          >
            ←
          </button>
          <div>
            <p>Match week {matchWeekCount}</p>
          </div>

          <button
            aria-label="next-button"
            className="p-2 flex w-12 h-12  items-center justify-center font-bold rounded-full cursor-pointer bg-[#fac4a3] border-2 border-dashed border-[brown] text-[brown]  hover:font-bold"
            onClick={() => {
              if (currentFixtureIndex >= matchFixtures.length - 2) {
                // Go to first week
                setCurrentFixtureIndex(0);
                setMatchWeekCount(1);
              } else {
                setCurrentFixtureIndex(currentFixtureIndex + 2);
                setMatchWeekCount(matchWeekCount + 1);
              }
            }}
          >
            →
          </button>
        </div>

        <div className="text-center my-2 text-lg font-semibold text-black">
          {matchFixtures[currentFixtureIndex]?.date}
        </div>

        <div className="w-full flex ">
          <ul className="w-full flex flex-col gap-12  bg-[#fac4a3] border-2 border-dashed border-[#62381d] text-black p-6 rounded-xl">
            {renderMatch(matchFixtures[currentFixtureIndex], currentFixtureIndex)}
            <li>
              <span className="w-full h-[.5px] bg-black block my-0"></span>
            </li>
            {matchFixtures[currentFixtureIndex + 1] &&
              renderMatch(matchFixtures[currentFixtureIndex + 1], currentFixtureIndex + 1)}
          </ul>
        </div>
      </section>

      <section className=" mb-20 mt-32 mx-6 md:w-[70vw] md:mx-auto">
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
