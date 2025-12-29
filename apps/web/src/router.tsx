import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { SessionsPage } from "./routes/SessionsPage";
import { NewSessionPage } from "./routes/NewSessionPage";
import { SessionWorkspace } from "./routes/SessionWorkspace";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <SessionsPage /> },
      { path: "sessions/new", element: <NewSessionPage /> },
      { path: "sessions/:sessionId", element: <SessionWorkspace /> }
    ]
  }
]);
