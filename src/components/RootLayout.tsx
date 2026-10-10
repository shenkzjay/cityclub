import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router";
import { RequireAdmin } from "../admin/require-admin";
import { trpc } from "../client/trpc";
import { PageLoader } from "./PageLoader";

const App = lazy(() => import("../App"));
const Admin = lazy(() => import("../admin/index"));
const AdminSignIn = lazy(() => import("../admin/sign-in/index"));
const SignUp = lazy(() => import("../admin/signup/index"));
const CreateTeams = lazy(() => import("../admin/teams/create-teams"));
const CreatePlayers = lazy(() => import("../admin/players/create-players"));
const PointsUpdate = lazy(() => import("../admin/points/points-update"));
const CompetitionsAdmin = lazy(() => import("../admin/competitions/index"));
const NewsAdmin = lazy(() => import("../admin/news/index"));
const FixturesAdmin = lazy(() => import("../admin/fixtures/index"));
const PredictionsAdmin = lazy(() => import("../admin/predictions/index"));
const NewsPage = lazy(() => import("../pages/news-page"));
const TeamPage = lazy(() => import("../pages/team-page"));
const HistoryPage = lazy(() => import("../pages/history-page"));
const CompetitionPage = lazy(() => import("../pages/competition-page"));
const PredictPage = lazy(() => import("../pages/predict-page"));
const TotwPage = lazy(() => import("../pages/totw-page"));
const TotwAdmin = lazy(() => import("../admin/totw/index"));

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-[#fff] flex items-center justify-center">
      <PageLoader label="Loading…" />
    </div>
  );
}

export function RootLayout() {
  const utils = trpc.useUtils();

  useEffect(() => {
    utils.getTeams.prefetch();
    utils.getFixtures.prefetch();
    utils.getPlayers.prefetch();
    utils.getActiveCompetition.prefetch();
    utils.getTeamOfTheWeek.prefetch();
    utils.newsList.prefetch();
  }, [utils]);

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/signin" element={<AdminSignIn />} />
        <Route
          path="/signup"
          element={
            <RequireAdmin>
              <SignUp />
            </RequireAdmin>
          }
        />
        <Route path="/admin/teams/create-teams" element={<CreateTeams />} />
        <Route path="/admin/players/create-players" element={<CreatePlayers />} />
        <Route path="/admin/points/points-update" element={<PointsUpdate />} />
        <Route path="/admin/competitions" element={<CompetitionsAdmin />} />
        <Route path="/admin/news" element={<NewsAdmin />} />
        <Route path="/admin/fixtures" element={<FixturesAdmin />} />
        <Route path="/admin/predictions" element={<PredictionsAdmin />} />
        <Route path="/admin/totw" element={<TotwAdmin />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/news/:slug" element={<NewsPage />} />
        <Route path="/teams/:teamName" element={<TeamPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:competitionId" element={<CompetitionPage />} />
        <Route path="/totw" element={<TotwPage />} />
      </Routes>
    </Suspense>
  );
}