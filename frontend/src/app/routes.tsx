import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./pages/Home";
import { FeedPage } from "./pages/Feed";
import { MapPage } from "./pages/MapPage";
import { NotificationsPage } from "./pages/Notifications";
import { ProfilePage } from "./pages/Profile";
import { IncidentDetailsPage } from "./pages/IncidentDetails";

export const router = createBrowserRouter([
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
]);
