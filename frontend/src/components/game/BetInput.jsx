import { Label, NumberInput, SmallButton } from "@/components/common/Bits";

export const BetInput = ({ value, onChange, disabled, balance, testId = "bet", presets = [10, 50, 100, 500] }) => {
  const set = (v) => onChange(Math.max(1, Math.floor(Number(v) || 0)));
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Einsatz</Label>
        <span className="text-[11px] font-mono text-dim-2 tabular mb-2">Guthaben {Math.round(balance).toLocaleString("de-DE")} €</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <NumberInput min={1} value={value} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled} data-testid={`${testId}-amount-input`} className="pr-8" />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-dim-2">€</span>
        </div>
        <SmallButton onClick={() => set(value / 2)} disabled={disabled} data-testid={`${testId}-half-button`}>
          ½
        </SmallButton>
        <SmallButton onClick={() => set(Math.min(value * 2, Math.max(1, balance)))} disabled={disabled} data-testid={`${testId}-double-button`}>
          2×
        </SmallButton>
        <SmallButton onClick={() => set(balance)} disabled={disabled} data-testid={`${testId}-max-button`}>
          Max
        </SmallButton>
      </div>
      <div className="mt-2 flex gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => set(p)}
            disabled={disabled}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-mono font-semibold transition-colors duration-200 disabled:opacity-40 ${
              value === p ? "border-brand/50 bg-brand/10 text-brand" : "border-line-2 bg-panel-2 text-dim hover:text-txt hover:border-line"
            }`}
            data-testid={`${testId}-preset-${p}`}
          >
            {p.toLocaleString("de-DE")}
          </button>
        ))}
      </div>
    </div>
  );
};
