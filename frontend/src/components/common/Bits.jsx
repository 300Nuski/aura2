import { cn } from "@/lib/utils";

export const Panel = ({ className = "", children, featured = false, ...rest }) => (
  <div
    className={cn(
      "rounded-2xl glass border border-line/80 shadow-card",
      featured && "ring-1 ring-brand/25 shadow-glow-brand",
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

export const Label = ({ children, className = "", ...rest }) => (
  <label className={cn("block text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-2", className)} {...rest}>
    {children}
  </label>
);

export const Pill = ({ tone = "neutral", className = "", children, ...rest }) => {
  const tones = {
    neutral: "bg-aqua/10 text-txt-2 border-aqua/20",
    win: "bg-win/15 text-win border-win/25",
    loss: "bg-danger/12 text-danger border-danger/25",
    gold: "bg-brand/15 text-brand-2 border-brand/40",
    amber: "bg-gold/15 text-gold border-gold/40",
    aqua: "bg-aqua/15 text-aqua border-aqua/30",
    info: "bg-info/15 text-info border-info/30",
    dim: "bg-surface-2 text-dim border-line",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono font-semibold tabular", tones[tone], className)} {...rest}>
      {children}
    </span>
  );
};

export const StatCard = ({ icon: Icon, label, value, tone = "txt", className = "", ...rest }) => {
  const tones = { txt: "text-txt", win: "text-win", danger: "text-danger", gold: "text-brand", aqua: "text-aqua", info: "text-info" };
  return (
    <Panel className={cn("p-5", className)} {...rest}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-dim-2" />}
      </div>
      <p className={cn("font-mono font-semibold text-xl sm:text-2xl tabular leading-none", tones[tone])}>{value}</p>
    </Panel>
  );
};

export const EmptyState = ({ icon: Icon, title, text, action, className = "" }) => (
  <div className={cn("flex flex-col items-center justify-center text-center py-10 px-6", className)} data-testid="empty-state">
    {Icon && (
      <span className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-dim" />
      </span>
    )}
    <p className="font-display font-semibold text-base text-txt mb-1">{title}</p>
    {text && <p className="text-sm text-dim max-w-xs leading-relaxed">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton = ({ className = "" }) => <div className={cn("shimmer rounded-lg", className)} data-testid="loading-skeleton" />;

export const PrimaryButton = ({ className = "", children, tone = "gold", ...rest }) => {
  const tones = {
    gold: "bg-brand text-brand-fg hover:brightness-[1.04] shadow-glow-brand",
    win: "bg-win text-[#04150d] hover:brightness-[1.04] shadow-glow-win",
    aqua: "bg-aqua text-aqua-fg hover:brightness-[1.04] shadow-glow-aqua",
    danger: "bg-danger text-white hover:brightness-[1.04] shadow-glow-danger",
    secondary: "bg-raised text-txt border border-line hover:border-brand/40",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-[filter,border-color,background-color] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export const NumberInput = ({ className = "", ...rest }) => (
  <input
    type="number"
    className={cn(
      "w-full min-w-0 rounded-xl bg-surface-2 border border-line px-4 py-3 font-mono font-semibold text-sm text-txt tabular focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2 focus:border-aqua/40 disabled:opacity-50 placeholder:text-dim-2",
      className
    )}
    {...rest}
  />
);

export const SmallButton = ({ className = "", active = false, children, ...rest }) => (
  <button
    className={cn(
      "rounded-lg border px-3 py-2.5 text-xs font-mono font-semibold transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2",
      active ? "bg-raised border-brand/50 text-brand" : "bg-surface-2 border-line text-txt-2 hover:border-brand/40 hover:text-txt",
      className
    )}
    {...rest}
  >
    {children}
  </button>
);
