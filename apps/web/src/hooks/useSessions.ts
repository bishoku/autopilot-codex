import { useQuery } from "@tanstack/react-query";
import { listSessions } from "../lib/api";

export const useSessions = () => {
  return useQuery({ queryKey: ["sessions"], queryFn: listSessions });
};
