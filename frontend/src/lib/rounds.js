import api from "@/lib/api";

export const recordRound = (round) => api.post("/rounds", round).catch(() => {});
