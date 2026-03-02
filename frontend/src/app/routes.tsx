import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./pages/Home";
import { FeedPage } from "./pages/Feed";
import { MapPage } from "./pages/MapPage";
import { NotificationsPage } from "./pages/Notifications";
import { ProfilePage } from "./pages/Profile";
import { IncidentDetailsPage } from "./pages/IncidentDetails";
import { AuthPage } from "./pages/Auth";
import { PublicOnlyAuthRoute, RequireAuth } from "./components/auth/AuthGuards";
import { SingpassCallbackPage } from "./pages/SingpassCallback";

export const router = createBrowserRouter([
  {
    Component: PublicOnlyAuthRoute,
    children: [
      {
        path: "/auth",
        Component: AuthPage,
      },
      {
        path: "/auth/singpass/callback",
        Component: SingpassCallbackPage,
      },
    ],
  },
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
          { path: "incidents/:incidentId", Component: IncidentDetailsPage },
          { path: "notifications", Component: NotificationsPage },
          { path: "profile", Component: ProfilePage },
          { path: "*", Component: () => <div>Not Found</div> },
        ],
      },
    ],
  },
]);
