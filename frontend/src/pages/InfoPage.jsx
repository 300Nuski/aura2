import { useParams, useNavigate } from "react-router-dom";
import { Info, Scale, HeartHandshake, FileText, ArrowLeft } from "lucide-react";
import { Panel } from "@/components/common/Bits";

const SECTIONS = {
  about: {
    title: "Über Aura Royale",
    icon: Info,
    body: [
      "Aura Royale ist eine Demo-Plattform für Casino-Originals und Klassiker — komplett mit Spielgeld. Es gibt keine Einzahlungen mit echtem Geld und keine Auszahlungen.",
      "Alle sieben Spiele (Crash, Dice, Mines, Coinflip, Roulette, Blackjack, Sweet Bonanza) teilen sich ein gemeinsames Guthaben. Registrierte Spieler behalten Guthaben, Verlauf und Statistiken.",
      "Der Live-Feed, die Bestenliste und der Chat zeigen echte Aktivität aller registrierten Spieler.",
    ],
  },
  fairplay: {
    title: "Fair Play",
    icon: Scale,
    body: [
      "Crash: Der Absturzpunkt wird pro Runde zufällig gezogen (0,99 ÷ Zufall), Maximum 100x. Der Hausvorteil beträgt 1 %.",
      "Dice: Ergebnis 0,00–99,99. Multiplikator = 99 ÷ Gewinnchance (1 % Hausvorteil).",
      "Mines: 25 Felder, 1–24 Minen. Multiplikator nach k Edelsteinen = 0,99 × C(25,k) ÷ C(25−n,k).",
      "Coinflip: 50/50, Auszahlung 1,96x pro Treffer (2 % Hausvorteil). Der Pot kann beliebig oft weitergespielt oder mitgenommen werden.",
      "Roulette: europäisch, 37 Felder. Blackjack: Dealer steht ab 17, Blackjack zahlt 3:2.",
    ],
  },
  responsible: {
    title: "Verantwortungsvolles Spielen",
    icon: HeartHandshake,
    body: [
      "Auch mit Spielgeld gilt: Spiele bewusst und mache Pausen. Aura Royale richtet sich ausschließlich an Personen ab 18 Jahren.",
      "Glücksspiel kann süchtig machen. Kostenlose, anonyme Hilfe: BZgA-Telefonberatung 0800 1 37 27 00 oder www.check-dein-spiel.de.",
      "Nutze die Stop-Limits im Auto-Modus von Crash, um Gewinne und Verluste zu begrenzen.",
    ],
  },
  terms: {
    title: "Nutzungsbedingungen",
    icon: FileText,
    body: [
      "Das Angebot ist eine Simulation ohne Geldwert. Guthaben, Boni und Gewinne sind reines Spielgeld und können nicht ausgezahlt werden.",
      "Konten können bei Missbrauch (z. B. Chat-Spam oder Beleidigungen) ohne Vorankündigung deaktiviert werden.",
      "Gespeichert werden Anzeigename, E-Mail, Passwort-Hash, Guthaben, Spielrunden und Chat-Nachrichten. Es findet kein Tracking durch Dritte statt.",
    ],
  },
};

export default function InfoPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const active = SECTIONS[section] ? section : "about";
  const cur = SECTIONS[active];
  const Icon = cur.icon;

  return (
    <div data-testid="info-page">
      <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-sm font-semibold text-dim hover:text-txt transition-colors duration-200 mb-4" data-testid="info-back-button">
        <ArrowLeft className="w-4 h-4" /> Startseite
      </button>
      <div className="grid grid-cols-12 gap-5">
        <Panel className="col-span-12 md:col-span-4 p-3">
          {Object.entries(SECTIONS).map(([id, s]) => (
            <button key={id} onClick={() => navigate(`/info/${id}`)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-left transition-colors ${active === id ? "bg-brand text-white" : "text-txt-2 hover:bg-panel-2"}`} data-testid={`info-tab-${id}`}>
              <s.icon className="w-4 h-4" /> {s.title}
            </button>
          ))}
        </Panel>
        <Panel className="col-span-12 md:col-span-8 p-6 sm:p-8">
          <span className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/40 flex items-center justify-center mb-4">
            <Icon className="w-5 h-5 text-brand-2" />
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl mb-4" data-testid="info-title">
            {cur.title}
          </h1>
          <div className="space-y-3">
            {cur.body.map((p, i) => (
              <p key={i} className="text-sm text-txt-2 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
