import { Crown } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-line-2 pt-8 pb-4 mt-6" data-testid="footer">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <p className="font-display font-bold text-sm mb-1.5 inline-flex items-center gap-2">
          <Crown className="w-4 h-4 text-brand" />
          Aura <span className="text-brand">Royale</span>
        </p>
        <p className="text-xs text-dim max-w-md leading-relaxed">
          © 2026 Aura Royale. Demo-Plattform — alle Spiele, Gewinne und Guthaben nutzen ausschließlich Spielgeld. Keine Echtgeld-Glücksspiele, keine Auszahlungen.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-10 h-10 rounded-full border-2 border-danger text-danger font-mono font-bold text-[11px] flex items-center justify-center shrink-0" data-testid="footer-age-badge">
          18+
        </span>
        <p className="text-[11px] text-dim max-w-[260px] leading-relaxed">Glücksspiel kann süchtig machen. Hilfe: BZgA 0800&nbsp;1&nbsp;37&nbsp;27&nbsp;00 (kostenlos &amp; anonym).</p>
      </div>
    </div>
  </footer>
);
