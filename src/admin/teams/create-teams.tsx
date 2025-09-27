import { useState, type FormEvent } from "react";
import { trpc } from "../../client/trpc";
import { AdminLayout } from "../layout";

export const CreateTeamsComponent = () => {
  const [selectedColor, setSelectedColor] = useState("");

  const utils = trpc.useUtils();
  const teamCreator = trpc.teamCreate.useMutation({
    onSuccess: () => {
      //invalidate queries to trigger refetch
      utils.getTeams.invalidate();
      utils.getPlayers.invalidate();
      utils.getUnassignedPlayers.invalidate();
    },
    onError: (error) => {
      console.error("Team creation failed:", error);
    },
  });

  const { data: teams, isLoading, isError } = trpc.getTeams.useQuery();

  const {
    data: unassignedPlayers,
    isLoading: unassignedPlayersLoading,
    isError: unassignedPlayersError,
  } = trpc.getUnassignedPlayers.useQuery();

  const { data: players, isLoading: loading, isError: error } = trpc.getPlayers.useQuery();

  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  console.log({ selectedPlayers });

  const [toggleDropdown, setToggleDropdown] = useState(false);

  const selectedPlayerNames = selectedPlayers.map(
    (id) => players?.find((player) => player.id === id)?.playerName
  );

  console.log({ teams });

  const handleSelect = (e: React.MouseEvent<HTMLInputElement>) => {
    const event = (e.target as HTMLInputElement).value;

    if (event) {
      console.log({ event });
      setSelectedColor(event);
    }
  };

  const handleToggle = () => {
    setToggleDropdown((prev) => !prev);
  };

  const handleSelectPlayers = (e: React.ChangeEvent<HTMLInputElement>, playerId: number) => {
    if (e.target.checked) {
      // add player if checked
      setSelectedPlayers((prev) => [...prev, playerId]);
    } else {
      // remove player if unchecked
      setSelectedPlayers((prev) => prev.filter((id) => id !== playerId));
    }
  };

  const handleSubmitTeam = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const teamData = {
      teamName: formData.get("teamName") as string,
      description: formData.get("teamDescription") as string,
      color: selectedColor,
      playerIds: selectedPlayers,
    };

    console.log({ teamData });
    try {
      const createTeam = await teamCreator.mutateAsync(teamData);

      console.log({ createTeam });
      e.currentTarget?.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <section className="flex gap-12 p-6">
        <form className="w-1/2 flex flex-col" onSubmit={handleSubmitTeam}>
          <fieldset className="grid gap-6 mb-6 border p-6 rounded-xl">
            <legend>Create teams</legend>

            <div>
              <label htmlFor="teamName" className="sr-only">
                Team name
              </label>
              <input
                name="teamName"
                id="teamName"
                placeholder="Team name"
                className="border py-2 px-4 rounded-xl w-full"
              />
            </div>

            <div>
              <label htmlFor="teamDescription" className="sr-only">
                Team description
              </label>
              <textarea
                name="teamDescription"
                id="teamDescription"
                placeholder="write a short description about the team (optional)"
                className="border py-2 px-4 rounded-xl w-full"
              />
            </div>

            {/* multiselect dropdown */}
            <div>
              <div className="">
                <ul className="flex flex-row gap-4 text-sm flex-wrap mb-6">
                  {selectedPlayerNames.map((name, index) => (
                    <li key={index} className="flex bg-slate-200 text-black px-2 py-1 rounded-lg">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="flex justify-between w-full py-2 px-4 border rounded-lg cursor-pointer"
                role="button"
                onClick={handleToggle}
              >
                <h3>Select players</h3>
                {toggleDropdown ? <span>↓</span> : <span>↑</span>}
              </div>

              {/**dropdown card */}
              {toggleDropdown && (
                <ul className="h-24 overflow-y-auto border rounded-xl">
                  {unassignedPlayers && unassignedPlayers.length > 0 ? (
                    unassignedPlayers.map((player, idx) => (
                      <li
                        key={idx}
                        className="cursor-pointer w-full flex flex-row gap-2 items-center even:bg-[#333] px-2 py-1 "
                      >
                        <input
                          type="checkbox"
                          name={player.playerName}
                          checked={selectedPlayers.includes(player.id)}
                          id={player.playerName}
                          onChange={(e) => handleSelectPlayers(e, player.id)}
                        />
                        <label htmlFor={player.playerName} className="w-full cursor-pointer">
                          {player.playerName}
                        </label>
                      </li>
                    ))
                  ) : (
                    <li>no players yet</li>
                  )}
                </ul>
              )}
            </div>

            <div className="flex flex-row gap-6" onClick={handleSelect}>
              <label
                htmlFor="red"
                className={` ${
                  selectedColor === "red" ? "bg-red-500 text-white" : ""
                } py-2 px-6 rounded-xl border border-red-500 text-red-500 hover:outline-2`}
              >
                red
              </label>
              <input
                type="radio"
                name="teamColor"
                id="red"
                value="red"
                placeholder="Team color"
                className="border py-2 px-4 rounded-xl hidden"
              />
              <label
                htmlFor="green"
                className={` ${
                  selectedColor === "green" ? "bg-green-500 text-white" : ""
                } py-2 px-6 rounded-xl border border-green-500 text-green-500 hover:outline-2`}
              >
                green
              </label>
              <input
                type="radio"
                name="teamColor"
                id="green"
                value="green"
                placeholder="Team color"
                className="border py-2 px-4 rounded-xl hidden"
              />
              <label
                htmlFor="orange"
                className={` ${
                  selectedColor === "orange" ? "bg-orange-500 text-white" : ""
                } py-2 px-6 rounded-xl border border-orange-500 text-orange-500 hover:outline-2`}
              >
                orange
              </label>
              <input
                type="radio"
                name="teamColor"
                id="orange"
                value={"orange"}
                placeholder="Team color"
                className="border py-2 px-4 rounded-xl hidden"
              />
              <label
                htmlFor="blue"
                className={` ${
                  selectedColor === "blue" ? "bg-blue-500 text-white" : ""
                } py-2 px-6 rounded-xl border border-blue-500 text-blue-500 hover:outline-2`}
              >
                blue
              </label>
              <input
                type="radio"
                name="teamColor"
                id="blue"
                value="blue"
                placeholder="Team color"
                className="border py-2 px-4 hidden"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-white text-black font-semibold rounded-xl"
            >
              Create team
            </button>
          </fieldset>
        </form>

        <section className="w-1/2 ">
          <h3>Team list</h3>
          <table className="w-full  text-left">
            <thead>
              <tr>
                <th className=" px-3 py-2">ID</th>
                <th className=" px-3 py-2">Team Name</th>
                <th className=" px-3 py-2">Color</th>
                <th className=" px-3 py-2"></th>
                <th className=" px-3 py-2"></th>
                <th className=" px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {teams && teams.length > 0 ? (
                teams.map((team, idx) => (
                  <tr key={idx} className="odd:bg-[#333] even:bg-[#262626] ">
                    <td className=" px-3 py-2">{idx + 1}</td>
                    <td className={`px-3 py-2`}>{team.teamName}</td>
                    <td className=" px-3 py-2">{team.color}</td>
                    <td className=" px-3 py-2">Edit</td>
                    <td className=" px-3 py-2">delete</td>
                    <td className=" px-3 py-2">view →</td>
                  </tr>
                ))
              ) : (
                <tr className="w-full col-span-4 border">
                  <td className="col-span-4 row-span-4  w-full">No team created yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </section>
    </AdminLayout>
  );
};

export default CreateTeamsComponent;
