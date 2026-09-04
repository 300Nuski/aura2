# plan.md

## 1. Objectives
- **Komplettes Redesign** von AURA ROYALE (neue Visuals/Design-Tokens/Layouts), ohne Funktionalität zu verlieren.
- **Crash reparieren**: kein Wackeln, grüner Strahl bleibt dauerhaft (auch bei langen Runden), stabile Performance.
- **Neue Spiele**: **Dice**, **Mines**, **Coinflip** (voll spielbar, Balance-Update, Round-Logging).
- **Alles funktionell**: keine „Demo folgt“-Deadends mehr; Lobby/Sidebar/Nav verlinken nur auf funktionierende Seiten.
- **Echte Social/Meta Features** über Backend: Live-Feed aus echten Rounds, Leaderboard, Chat, Deposit (server-seitig), Profil/Stats.

## 2. Implementation Steps

### Phase 1 — Core POC: Crash Canvas Renderer (isoliert, erst fixen dann weiter)
**User Stories**
1. Als Spieler sehe ich eine **glatte Crash-Kurve** ohne Ruckeln.
2. Als Spieler bleibt der **grüne Strahl** über die komplette Runde **vom Ursprung bis zur Rakete** sichtbar (z.B. >15s).
3. Als Spieler fliegt die Rakete **stabil ohne Wackeln** (Rotation/Tangent sauber).
4. Als Spieler sehe ich beim Crash eine **klare Crash-Animation** (rot/Explosion), danach startet die nächste Runde.
5. Als Spieler bleibt die UI (Tabs/Einsatz) responsiv trotz Animation.

**Steps**
- Websearch: Best Practices „Canvas rAF chart + React“ (state vs refs, throttling) + „analytic curve tangent“.
- Neue Komponente `CrashGraphCanvas`:
  - Canvas 2D Renderer (rAF), analytic m(t)=exp(G*t), **nie** points slice wegwerfen.
  - Stable scaling: domain basierend auf elapsed/crashPoint, keine 0.01-Quantisierung für Geometrie.
  - Rocket position/rotation per transform/ref (kein React re-render pro frame).
  - Crash FX: Partikel/Glow + rote Kurve.
- `CrashGame` bleibt Logik/Betting, aber Graph/rocket rendering raus aus React-State.
- POC-Check: Screenshots/Video-like verification bei t≈6s, 12s, 18s: Strahl anchored + ruhig.

**Exit Criteria (Phase 1)**
- Beam endet nicht, Rocket jitter nicht sichtbar, FPS stabil (keine massiven Frame Drops).

---

### Phase 2 — V1 App Development (Redesign + neue Games + echte Datenflüsse)
**User Stories**
1. Als Besucher sehe ich eine neue Lobby, bei der **jede Karte** zu einem **funktionierenden** Spiel/Feature führt.
2. Als Spieler kann ich mich registrieren/anmelden und mein Guthaben bleibt erhalten.
3. Als Spieler kann ich Dice/Mines/Coinflip spielen und mein Guthaben + Verlauf aktualisieren sich sofort.
4. Als Spieler sehe ich einen **echten Live-Feed** aus realen Rounds (alle Spieler).
5. Als Spieler kann ich im **echten Chat** schreiben und Nachrichten anderer sehen (Polling).

**Backend (FastAPI/Mongo) – Erweiterungen**
- Rounds erweitern:
  - Speichern von `user_name` (aus user doc) beim POST `/api/rounds`.
  - Neue Endpoints:
    - `GET /api/rounds/recent?limit=` (public feed, ohne PII außer name).
    - `GET /api/leaderboard?range=24h|7d|all&limit=` (profit = payout - bet).
    - `GET /api/me/stats` (plays/wins/net/profit by game + streak basics).
- Chat:
  - `POST /api/chat/messages` (auth required), `GET /api/chat/messages?since=` (polling).
- Wallet:
  - `POST /api/wallet/deposit` (auth required) -> erhöht Balance server-seitig; optional rate-limit / max.

**Frontend — kompletter UI Umbau**
- Neues Design-System:
  - Tailwind tokens (Farben, surface layers), neue Typo/spacing, consistent cards/buttons.
  - Neue Shell: responsive Topbar/Sidebar, mobile bottom-nav.
- Navigation aufräumen:
  - Entferne/ersetze PvP/Jackpot/Cases/Esports „Demo folgt“ → entweder echte Seiten (V1 minimal) oder raus.
- Lobby neu:
  - Game Grid: Crash, Roulette, Blackjack, Sweet Bonanza, **Dice, Mines, Coinflip**.
  - Panels: **Live Feed (real)** + **Leaderboard (real)** + CTA Deposit.
- Neue Seiten:
  - `/dice`: Over/Under, Slider Target, Chance+Multiplier, Roll animation, 1-click bet.
  - `/mines`: mines count, grid reveal, cashout, loss reveal all, session state safe.
  - `/coinflip`: heads/tails, flip animation, payout 1.96x (house edge), streak option (double/take).
  - `/profile`: stats + my rounds list + deposit button.
- Existing games restyle + integrate with same shared balance flow and `recordRound`.
- Update `recordRound` calls for new games and ensure admin page still works.

**Phase 2 Testing (1 E2E round)**
- Delegate to testing_agent: register/login, deposit via server, play each game once, verify balance persistence + recent feed + leaderboard + chat.

---

### Phase 3 — Polish + Hardening
**User Stories**
1. Als Mobile-User kann ich alle Spiele sauber bedienen (no overflow, touch-friendly).
2. Als Spieler höre ich passende Sounds für Dice/Mines/Coinflip (optional toggle).
3. Als Spieler sehe ich klare Fehlerzustände (401, Netzwerkfehler) ohne UI-Bruch.
4. Als Admin sehe ich im neuen Design weiterhin User/Role/Balance Management.
5. Als Spieler sind Live Feed/Chat stabil (Polling interval + backoff).

**Steps**
- Performance/UX: debounce/poll intervals, skeleton states, empty states.
- Security sanity: chat input validation, rate limits (lightweight), leaderboard queries indexed.
- Update `memory/PRD.md` auf neuen Stand.
- Final E2E testing_agent Run + fix regressions.

## 3. Next Actions (immediately)
1. Websearch + Implement `CrashGraphCanvas` POC (Canvas rAF, analytic curve, stable rocket).
2. Wire POC into `/crash` behind a feature flag; verify long-run behavior.
3. Backend: add `/rounds/recent`, `/leaderboard`, chat endpoints.
4. Frontend: add Dice/Mines/Coinflip pages with minimal but complete gameplay + recordRound.
5. Redesign pass: new tokens + new Lobby with only working links.

## 4. Success Criteria
- Crash: **kein Wackeln**, **Beam bleibt** sichtbar bis Crash, auch bei langen Runden; keine spürbaren FPS-Einbrüche.
- Dice/Mines/Coinflip vollständig spielbar: korrekte Payouts, Balance persistiert, Rounds geloggt.
- Keine toasts „Demo folgt“ im Hauptfluss; Nav/Lobby verlinken nur auf funktionierende Seiten.
- Live Feed/Leaderboard/Chat zeigen echte Backend-Daten; Profil zeigt Stats + Historie.
- testing_agent bestätigt E2E: Auth, Deposit, alle Spiele, Admin, Persistenz.