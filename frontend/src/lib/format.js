export const fmt = (n) => `${Math.round(Number(n) || 0).toLocaleString("de-DE")} €`;
export const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString("de-DE");
export const fmtMult = (m) => `${(Number(m) || 0).toFixed(2)}x`;
export const fmtSigned = (n) => `${n >= 0 ? "+" : "−"}${Math.abs(Math.round(n)).toLocaleString("de-DE")} €`;
export const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 5) return "gerade eben";
  if (s < 60) return `vor ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} T`;
};
export const clockTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "");
export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
