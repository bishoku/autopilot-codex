import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/Header";
import { SideNav } from "../components/SideNav";
import { DebugPanel } from "../components/DebugPanel";
import { useMemo } from "react";

export const AppLayout = () => {
  const location = useLocation();
  const sessionId = useMemo(() => {
    const match = location.pathname.match(/sessions\/(.*)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[260px_1fr]">
        <SideNav sessionId={sessionId ?? undefined} />
        <main className="relative">
          <Outlet />
        </main>
      </div>
      <DebugPanel sessionId={sessionId ?? undefined} />
    </div>
  );
};
