import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./pages/Home";
import { FeedPage } from "./pages/Feed";
import { MapPage } from "./pages/MapPage";
import { NotificationsPage } from "./pages/Notifications";
import { ProfilePage } from "./pages/Profile";
import { IncidentDetailsPage } from "./pages/IncidentDetails";
import { SearchPage } from "./pages/Search";
import { AuthPage } from "./pages/Auth";
import { RequireAuth, PublicOnlyAuthRoute } from "./components/auth/AuthGuards";
import { AdminCasesPage } from "./pages/AdminCases";

export const router = createBrowserRouter([
  // /auth is only accessible when NOT signed in
  {
    Component: PublicOnlyAuthRoute,
    children: [
      { path: "/auth", Component: AuthPage },
    ],
  },
  // all app routes require a valid session
  {
    Component: RequireAuth,
    children: [
      {
        path: "/",
        Component: RootLayout,
        children: [
          { index: true, Component: HomePage },
          { path: "feed", Component: FeedPage },
          { path: "map", Component: MapPage },
          { path: "search", Component: SearchPage },
          { path: "incidents/:incidentId", Component: IncidentDetailsPage },
          { path: "notifications", Component: NotificationsPage },
          { path: "profile", Component: ProfilePage },
          { path: "*", Component: () => <div>Not Found</div> },
        ],
      },
      { path: "/admin/cases", Component: AdminCasesPage },
    ],
  },
]);
