import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route } from "react-router";
import { CreateTeamsComponent } from "./admin/teams/create-teams.tsx";
import Admin from "./admin/index.tsx";
import CreatePlayersComponent from "./admin/players/create-players.tsx";
import PointsUpdate from "./admin/points/points-update.tsx";
import NewsPage from "./pages/news-page.tsx";
import TeamPage from "./pages/team-page.tsx";

import { TRPCProvider } from "./provider.tsx";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <TRPCProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/teams/create-teams" element={<CreateTeamsComponent />} />
        <Route path="/admin/players/create-players" element={<CreatePlayersComponent />} />
        <Route path="/admin/points/points-update" element={<PointsUpdate />} />
        <Route path="/news/:slug" element={<NewsPage />} />
        <Route path="/teams/:teamName" element={<TeamPage />} />
      </Routes>
    </TRPCProvider>
  </BrowserRouter>
);
