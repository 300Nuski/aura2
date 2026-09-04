# PRD — AURA ROYALE Casino (Dark Dashboard)

## Original Problem Statement (deutsch)
"Erstelle mir eine Casino Landingpage mit einzigartigem Design, schlichten hellen farben und viele Animationen!"

## Design-Historie
- v1 (Juli 2026): Helle Ivory/Champagner-Luxus-Landingpage (verworfen auf User-Wunsch)
- v2 (Juli 2026): User lieferte fiery.gg-Screenshot → komplettes Redesign als dunkles Gaming-Dashboard
- v3 (Juli 2026): User-Wunsch: Roulette & Blackjack von Hauptseite entfernt → eigene Seiten via React Router; neues funktionierendes Crash-Spiel (Bloxflip-Screenshot als Referenz)

## Architektur
- Frontend-only React App, React Router (/, /roulette, /blackjack, /crash)
- Gemeinsames Guthaben (balance) in App.js → synchron über Topbar & alle Spiele
- framer-motion, lenis (Smooth Scroll), sonner (Toasts), lucide-react, Tailwind
- Layout: Topbar (Balance, Einzahlen-CTA, Nav) + linke Icon-Sidebar + rechter Live-Chat (xl) + Content

## Implementiert (Stand: Juli 2026)
- **Lobby (/):** HeroBanner (100% Bonus bis 1.500 €, Countdown), Bento-Grid (PvP, Roulette, Jackpot, Blackjack, Crash), Top Matches (Esports mit Live-Badges & Odds), Top Slots (Carousel), Live-Bets-Ticker (Tabs: Live/Glückssträhnen/Whale), Footer mit 18+
- **/roulette:** SVG-Europäisches Roulette (37 Segmente), Einsätze Rot/Schwarz/Gerade/Ungerade/Plein (×36), Chips 10–500, Verlauf, Regeln-Sidebar
- **/blackjack:** Deal/Hit/Stand/Reset, Dealer ab 17, Asse 1/11, Blackjack 3:2, Gewinnserie, Regeln-Sidebar
- **/crash:** Runden-Loop (5s Wartezeit → Multiplikator e^(0.00013·t) → Crash 0.99/(1-r)), SVG-Kurve mit Rakete (Rotation folgt Kurve), History-Pills, Bot-Spielerliste mit Cashouts, Auto-Cashout, Quick-Bets (1/2, 2×, Max)
- **Bonus-Modal:** Code AURA-2026-ROYALE, Demo-Einzahlung +1.000 €
- **Chat:** simulierte Community-Nachrichten + eigenes Senden

- **Crash-Upgrade (Juli 2026):** futuristische Detail-Rakete (eigenes SVG: Metallrumpf, Canopy, Flossen, Neon-Streifen, flackernde Triebwerksflamme) + Rauchwolken-Trail statt grüner Linie (geblurte SVG-Kreise, rot beim Crash)
- **Gewinn-Sounds (Juli 2026):** Web-Audio-Chimes in src/lib/sounds.js — playWinChime (Roulette-Treffer, Blackjack-Sieg/Blackjack 3:2), playCashoutChime (Crash-Cashout, Sweep + Ding)

## Verifiziert
- Crash: Wette platziert (100 €), Ausstieg bei 1.31x → +131 €, Balance synchron in Topbar
- Crash v2: Rakete + Rauch-Trail rendern, Crash bei 1.23x korrekt abgewickelt (Einsatz verloren, Verlauf aktualisiert)
- Roulette-Seite: Spin gewonnen (19 Rot, +100 €), Balance 1.561 → 1.611
- Blackjack-Seite: Austeilen, Scores, verdeckte Dealer-Karte OK; Zurück-Navigation OK
- Lobby: Arena-Sektion entfernt, Bento-Karten navigieren zu den Spielseiten
- Sounds: in allen Gewinn-Pfaden verdrahtet (AudioContext, try/catch, ohne User-Geste stumm)

## Admin & Verlauf (Juli 2026)
- Admin-Panel (/admin, nur role=admin): Nutzerliste mit Stats, Guthaben inline editierbar, Rollen-Toggle (Admin machen/entfernen, Selbst-Degradierung blockiert), 403 für Nicht-Admins
- Runden-Historie: POST /api/rounds (Roulette/Blackjack/Crash/Sweet Bonanza loggen jede Runde), GET /api/rounds/mine — im Konto-Menü als „Letzte Runden" mit Spiel, Multi & Auszahlung
- Admin-Links in Topbar & Sidebar nur für Admins sichtbar

## Sweet Bonanza Slot (Juli 2026)
- /sweet-bonanza: 6×5 Candy-Grid, Scatter-Pays (8+ gleiche Symbole überall), Tumble-Mechanik mit Drop-in-Kaskaden, Gewinner-Pulsieren
- v2 Redesign (Candy-Jar-Stil): helles Pastell-Candyland, 9 Premium-SVG-Symbole (Blaubeere, Zitrone, Kiwi, Wassermelone, Orange, Pflaume, Gelee, Donut, Cupcake), Glas-Scatter + Multi-Glas (x2-x100), Freispiele-kaufen-Panel (100x Einsatz), Glas-Spalte rechts, Pflaumen-Bottom-Bar mit rundem Spin-Button
- Freispiele: 4+ Glaeser → 10 FS (+5 Retrigger), Multi-Glaeser ×2–×100 multiplikieren Rundengewinn
- Candy-Design: Zuckerstangen-Rahmen, Lila-Verlauf, Twinkle-Sparkles, Screen-Shake + Splash bei Big Win (≥10×), Gewinn-Sounds
- Verlinkt: Sidebar „Slots", Top-Slots-Karte „Sweet Bonanza" (Tag SPIELBAR)

## UI-Bilder & Spiel-Upgrades (Juli 2026)
- Lobby-Bilder: cinematische Foto-Hintergründe (dunkles Overlay) in HeroBanner, allen 5 Bento-Karten & 3 Top-Matches-Karten (Unsplash) → professioneller Look
- Blackjack v2: großer Filztisch über volles Sichtfeld (radialer Grün-Verlauf, min-h 56vh, BLACKJACK-Emblem), stark vergrößerte Karten, Dealer oben/Spieler unten mittig, Score-Badges; Seite full-width, Regeln als Leiste darunter
- Crash-Flug v3: leuchtende grüne Flugkurve (Gradient + Glow) statt loser Rauchpunkte, Sternenhimmel-Backdrop (funkelnd), Flächenfüllung unter Kurve, Rakete sitzt sauber an Kurvenspitze (Rotation geglättet über 6 Punkte), Idle-Bob im Flug, Absturz-Animation (Rakete fällt & verblasst, Kurve/Trail rot), Graph vergrößert (H 340)

## Blackjack Split/Double & Crash Auto (Juli 2026)
- Blackjack Mehr-Hand-Engine: Verdoppeln (1 Karte, Einsatz ×2, dann Stand) & Teilen (Paare, bis 4 Hände, geteilte Asse = 1 Karte+Auto-Stand), aktive Hand hervorgehoben (Mint-Ring), pro Hand Score/Einsatz/Ergebnis, Dealer-Auflösung über alle Hände, Netto-Auszahlung
- Crash Auto-Modus: echte Auto-Wetten (Manuell/Auto-Tabs), Anzahl Wetten (0=endlos, Presets 10/25/∞), Stop bei Gewinn/Verlust (€), Live-Stats (Runde x/y, Netto), Auto-Cashout je Runde, Start/Stop; platziert automatisch pro Wartephase
- Crash Wackel-Fix: „Bob"-Effekt entfernt + Raketen-Rotation exponentiell geglättet (EMA 0.12) → ruhiger Flug

## Backlog / nächste Schritte
- P1: PvP-Duelle & Jackpot-Tickets als echte Minispiele
- P1: Crash Auto-Modus (Auto-Bet Wiederholung)
- P2: Passwort-Reset per E-Mail (Resend)
- P2: Echtes Backend für Chat/Leaderboard

## Auth (Juli 2026)
- E-Mail/Passwort-Auth: FastAPI + JWT (httpOnly Cookies, access 15 Min / refresh 7 Tage), bcrypt-Hashes, MongoDB users-Collection (unique Index auf email)
- Endpunkte: register/login/logout/me + GET/PUT /api/auth/balance (Guthaben pro Konto persistent)
- Frontend: AuthContext, AuthModal (Login/Registrieren-Tabs), Topbar mit Anmelden-Button bzw. Konto-Menü (Abmelden), Guthaben-Sync (debounced PUT)
- Seed-Konten: admin@auraroyale.de / AuraAdmin2026! · demo@auraroyale.de / Demo2026!
