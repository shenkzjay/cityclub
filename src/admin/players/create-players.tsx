import { AdminLayout } from "../layout";
import { trpc } from "../../../client/trpc";
import { useState } from "react";

export const CreatePlayersComponent = () => {
  const utils = trpc.useUtils();
  const playerCreator = trpc.playerCreate.useMutation({
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      utils.getTeams.invalidate();
      utils.getPlayers.invalidate();

      // Optional: show success message, reset form, etc.
    },
    onError: (error) => {
      console.error("Team creation failed:", error);
    },
  });

  const { data: players } = trpc.getPlayers.useQuery();

  //pagination frontend
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  //editing players stats
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingGoals, setEditingGoals] = useState(0);
  const [editingAssists, setEditingAssists] = useState(0);
  const [editingYellowCard, setEditingYellowCard] = useState(0);
  const [editingRedCard, setEditingRedCard] = useState(0);
  const [editingPlayerName, setEditingPlayerName] = useState("");

  const playerUpdater = trpc.playerUpdate.useMutation();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const playerName = formData.get("playerName") as string;
    const goals = Number(formData.get("goals"));
    const assists = Number(formData.get("assists"));
    const yellowCard = Number(formData.get("yellowCard"));
    const redCard = Number(formData.get("redCard"));

    const playerData = {
      playerName,
      goals,
      assists,
      yellowCard,
      redCard,
    };

    try {
      if (editingPlayerId) {
        // Update existing player
        await playerUpdater.mutateAsync({
          id: editingPlayerId,
          playerName,
          goals,
          assists,
          yellowCard,
          redCard,
        });
        utils.getPlayers.invalidate();
        setEditingPlayerId(null);
        setEditingPlayerName("");
        setEditingGoals(0);
        setEditingAssists(0);
        setEditingYellowCard(0);
        setEditingRedCard(0);
      } else {
        // Create new player
        await playerCreator.mutateAsync(playerData);
        e.currentTarget.reset();
        setEditingPlayerName("");
        setEditingGoals(0);
        setEditingAssists(0);
        setEditingYellowCard(0);
        setEditingRedCard(0);
      }
      utils.getPlayers.invalidate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <section className="flex flex-row p-6 gap-12">
        <section className="w-1/3">
          <form onSubmit={handleSubmit}>
            <fieldset className="grid gap-6 mb-6 border p-6 rounded-xl">
              <legend className="">Create players</legend>
              <div>
                <label htmlFor="playerName" className="sr-only">
                  Player name
                </label>
                <input
                  type="text"
                  name="playerName"
                  id="playerName"
                  placeholder=" 🧍🏽‍♂️ Player name"
                  className="border py-2 px-4 rounded-xl w-full"
                  value={editingPlayerName}
                  onChange={(e) => setEditingPlayerName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="goals" className="sr-only">
                  goals
                </label>
                <input
                  type="number"
                  name="goals"
                  id="goals"
                  placeholder=" ⚽️  Player goals"
                  className="border py-2 px-4 rounded-xl w-full"
                />
              </div>
              <div>
                <label htmlFor="assists" className="sr-only">
                  Player assists
                </label>
                <input
                  type="number"
                  name="assists"
                  id="assists"
                  placeholder=" 🏃🏽‍♂️ Player assists"
                  className="border py-2 px-4 rounded-xl w-full"
                />
              </div>
              <div>
                <label htmlFor="yellowCard" className="sr-only">
                  Player yellowCard
                </label>
                <input
                  type="number"
                  name="yellowCard"
                  id="yellowCard"
                  placeholder=" 🟨 Player yellow card"
                  className="border py-2 px-4 rounded-xl w-full"
                />
              </div>
              <div>
                <label htmlFor="redCard" className="sr-only">
                  Player redCard
                </label>
                <input
                  type="number"
                  name="redCard"
                  id="redCard"
                  placeholder=" 🟥 Player red card"
                  className="border py-2 px-4 rounded-xl w-full"
                />
              </div>

              {editingPlayerId ? (
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white font-semibold rounded-xl"
                >
                  Update player
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black font-semibold rounded-xl"
                >
                  Create player
                </button>
              )}
            </fieldset>
          </form>
        </section>
        <section className="w-2/3">
          <h3>List of players</h3>

          <table className="w-full text-sm ">
            <thead className="w-full ">
              <tr>
                <td className="px-4 py-2">S/N</td>
                <td className="px-4 py-2">Player name</td>
                <td className="px-4 py-2">Goals</td>
                <td className="px-4 py-2">Assists</td>
                <td className="px-4 py-2">Yellow card</td>
                <td className="px-4 py-2">Red card</td>
                <td className="px-4 py-2"></td>
              </tr>
            </thead>
            <tbody>
              {currentPageIndex && currentPageIndex.length > 0 ? (
                currentPageIndex.map((player, idx) => (
                  <tr key={player.id} className="odd:bg-[#333] even:bg-[#262626]">
                    <td className="px-4 py-2">{startPageIndex + idx + 1}</td>
                    <td className="px-4 py-2">{player.playerName}</td>
                    <td className="px-4 py-2">
                      {editingPlayerId === player.id ? editingGoals : player.goals}
                    </td>
                    <td className="px-4 py-2">
                      {editingPlayerId === player.id ? editingAssists : player.assists}
                    </td>
                    <td className="px-4 py-2">
                      {editingPlayerId === player.id ? editingYellowCard : player.yellowCard}
                    </td>
                    <td className="px-4 py-2">
                      {editingPlayerId === player.id ? editingRedCard : player.redCard}
                    </td>
                    <td className="px-4 py-2">
                      {editingPlayerId === player.id ? (
                        <>
                          {/* <button
                            onClick={async () => {
                              await playerUpdater.mutateAsync({
                                id: player.id,
                                playerName: editingPlayerName,
                                goals: editingGoals,
                                assists: editingAssists,
                                yellowCard: editingYellowCard,
                                redCard: editingRedCard,
                              });
                              utils.getPlayers.invalidate();
                              setEditingPlayerId(null);
                            }}
                            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-xl"
                          >
                            Save
                          </button> */}
                          <button
                            onClick={() => setEditingPlayerId(null)}
                            className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-xl"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPlayerId(player.id);
                            setEditingPlayerName(player.playerName);
                            setEditingGoals(player.goals);
                            setEditingAssists(player.assists);
                            setEditingYellowCard(player.yellowCard);
                            setEditingRedCard(player.redCard);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-xl"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>No players yet</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="w-full  flex flex-row justify-between items-center  mt-6  ">
            <div className="flex flex-row gap-2 text-sm">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className="bg-[#7b7b7b] hover:bg-[#c4c4c4] text-black font-semibold px-3 py-1 rounded-sm"
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
              <p>
                Pages {currentPage}/{totalPages}
              </p>
            </div>
          </div>
        </section>
      </section>
    </AdminLayout>
  );
};

export default CreatePlayersComponent;
