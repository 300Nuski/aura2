{
  "meta": {
    "product": "AURA ROYALE (Play-Money Casino Originals)",
    "language": "de-DE",
    "design_goal": "Kompletter Redesign: premium, klar lesbar, high-delight, dark-first. Keine Reskin-Optik. Alle Modi funktional, keine Dead-Ends.",
    "style_fusion": {
      "visual_personality": [
        "Noir-Lux (Velvet/Onyx)",
        "Precision UI (terminal-like numbers)",
        "Arcade glow (sparsam, nur Akzente)",
        "Bento + Magazine grid (asymmetrisch, aber geordnet)"
      ],
      "do_not": [
        "Keine generischen neon-grünen Stake-Klone",
        "Keine transparenten Modal/Card Hintergründe",
        "Keine zentrierte App-Container Typo",
        "Keine dunklen/satten Gradient-Kombos (siehe Gradient Rules am Ende)"
      ]
    }
  },

  "typography": {
    "google_fonts_import": "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');",
    "font_families": {
      "display": "Fraunces, ui-serif, Georgia, serif",
      "body": "IBM Plex Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
      "mono": "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    },
    "usage": {
      "brand_wordmark": "Fraunces 700 (tight tracking)",
      "page_titles": "Fraunces 700",
      "ui_labels": "IBM Plex Sans 600",
      "numbers_multipliers": "IBM Plex Mono 600 (tabular feel)"
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-[700] tracking-[-0.02em]",
      "h2": "text-base md:text-lg font-[600] text-[color:var(--muted-foreground)]",
      "body": "text-sm md:text-base leading-6",
      "small": "text-xs text-[color:var(--muted-foreground)]",
      "mono_stat": "font-mono text-xs md:text-sm tracking-[-0.01em]"
    }
  },

  "color_system": {
    "concept": "Velvet Onyx + Champagne Gold + Ice Cyan. Grün bleibt als WIN/Beam-Farbe (nicht Primary Brand).",
    "tokens_hex": {
      "bg": "#07080C",
      "bg_2": "#0B0D14",
      "surface": "#101321",
      "surface_2": "#141A2B",
      "card": "#12162A",
      "card_2": "#161C33",
      "elevated": "#1A2140",
      "border": "#242C4D",
      "border_subtle": "#1B2240",

      "text": "#EEF0FF",
      "text_2": "#C9CDE6",
      "muted": "#9AA3C7",
      "muted_2": "#6F789F",

      "primary": "#E7C77A",
      "primary_2": "#F1D89A",
      "primary_fg": "#1A1408",

      "accent": "#7FE7D6",
      "accent_2": "#A7F3E6",
      "accent_fg": "#061312",

      "win": "#2EF2A5",
      "win_2": "#7CFFCB",
      "danger": "#FF4D6D",
      "danger_2": "#FF8AA0",
      "warning": "#FFB020",
      "info": "#6AA8FF",

      "focus_ring": "#A7F3E6",
      "shadow": "rgba(0,0,0,0.55)"
    },
    "per_game_accents": {
      "crash": { "beam": "#2EF2A5", "curve": "#7FE7D6", "crash": "#FF4D6D" },
      "dice": { "track": "#6AA8FF", "marker": "#E7C77A" },
      "mines": { "tile": "#7FE7D6", "mine": "#FF4D6D", "gem": "#2EF2A5" },
      "coinflip": { "heads": "#E7C77A", "tails": "#7FE7D6" },
      "roulette": { "red": "#FF4D6D", "black": "#0E1020", "green": "#2EF2A5" },
      "blackjack": { "felt": "#0E3B2E", "chip": "#E7C77A" },
      "sweet_bonanza": { "note": "Behält eigenes Candy-Look; nur Shell-Tokens (bg/surface/border) übernehmen." }
    },
    "hsl_tokens_for_shadcn_root": {
      "note": "Diese Werte sollen in index.css :root als HSL gesetzt werden (shadcn). Hex oben ist Quelle.",
      "background": "230 33% 4%",
      "foreground": "235 60% 97%",
      "card": "231 38% 12%",
      "card_foreground": "235 60% 97%",
      "popover": "231 38% 12%",
      "popover_foreground": "235 60% 97%",
      "primary": "41 74% 69%",
      "primary_foreground": "35 45% 8%",
      "secondary": "231 30% 16%",
      "secondary_foreground": "235 40% 92%",
      "muted": "231 30% 16%",
      "muted_foreground": "226 18% 70%",
      "accent": "170 66% 70%",
      "accent_foreground": "175 55% 6%",
      "destructive": "349 100% 65%",
      "destructive_foreground": "0 0% 98%",
      "border": "228 34% 22%",
      "input": "228 34% 22%",
      "ring": "170 66% 70%",
      "radius": "1rem"
    },
    "css_custom_properties_extra": {
      "--bg": "#07080C",
      "--surface": "#101321",
      "--card": "#12162A",
      "--elevated": "#1A2140",
      "--border": "#242C4D",
      "--text": "#EEF0FF",
      "--muted": "#9AA3C7",
      "--gold": "#E7C77A",
      "--aqua": "#7FE7D6",
      "--win": "#2EF2A5",
      "--danger": "#FF4D6D",
      "--warning": "#FFB020"
    }
  },

  "spacing_radius_shadow": {
    "radius": {
      "xs": "6px",
      "sm": "10px",
      "md": "14px",
      "lg": "18px",
      "xl": "24px",
      "pill": "999px"
    },
    "spacing_scale_px": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
    "shadows": {
      "card": "0 18px 40px rgba(0,0,0,0.45)",
      "card_inset": "inset 0 0 0 1px rgba(127,231,214,0.08)",
      "elevated": "0 22px 60px rgba(0,0,0,0.55)",
      "glow_gold": "0 0 0 1px rgba(231,199,122,0.18), 0 0 28px rgba(231,199,122,0.12)",
      "glow_aqua": "0 0 0 1px rgba(127,231,214,0.18), 0 0 28px rgba(127,231,214,0.12)",
      "glow_win": "0 0 0 1px rgba(46,242,165,0.18), 0 0 34px rgba(46,242,165,0.14)"
    }
  },

  "layout": {
    "app_shell": {
      "desktop_grid": "[sidebar 264px] [main 1fr] [chat 360px]",
      "tablet": "Sidebar collapsible; Chat as Drawer",
      "mobile": "Topbar sticky + BottomNav fixed; Chat via Sheet",
      "max_content_width": "1280px (Lobby main column), game pages full-width canvas area",
      "gutters": "px-4 sm:px-6 lg:px-8",
      "vertical_rhythm": "space-y-6 (cards), space-y-3 (dense lists)"
    },
    "lobby": {
      "pattern": "Magazine + Bento",
      "sections": [
        "Hero (left: headline + CTA, right: live multiplier ticker)",
        "Game Grid (7 cards, 2 featured)",
        "Live Feed (rounds) + Leaderboard (side-by-side)",
        "Promos/Challenges strip (optional)"
      ],
      "grid": {
        "desktop": "grid-cols-12 gap-6; hero: col-span-8, ticker: col-span-4; games: 12 with featured spans",
        "mobile": "single column; featured cards first; feed as horizontal scroll"
      }
    },
    "game_pages": {
      "pattern": "Canvas + Control Dock",
      "desktop": "Canvas area left (col-span-8/9), Bet panel right (col-span-4/3), below: history + players",
      "mobile": "Canvas top, Bet panel as sticky bottom sheet (not covering critical UI), history collapsible"
    }
  },

  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "slider": "/app/frontend/src/components/ui/slider.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "avatar": "/app/frontend/src/components/ui/avatar.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sonner": "/app/frontend/src/components/ui/sonner.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx"
    },

    "topbar": {
      "structure": [
        "Left: brand + current page breadcrumb",
        "Center (desktop): quick game switch (NavigationMenu) or Command palette trigger",
        "Right: animated balance pill + Deposit button + Account dropdown"
      ],
      "balance_pill": {
        "style": "rounded-full bg-[color:var(--card)] border border-[color:var(--border)] px-3 py-2 shadow-[var(--shadow-card)]",
        "number": "font-mono text-sm text-[color:var(--text)]",
        "micro_interaction": "On balance change: brief scale(1.02) + gold glow pulse 450ms",
        "data_testid": "topbar-balance-pill"
      },
      "deposit_button": {
        "variant": "primary",
        "style": "rounded-full",
        "icon": "lucide-react: Plus / Wallet",
        "data_testid": "topbar-deposit-button"
      },
      "account_menu": {
        "component": "DropdownMenu",
        "data_testid": "topbar-account-menu"
      }
    },

    "sidebar_nav": {
      "nav_item_states": {
        "default": "text-[color:var(--text_2)] hover:text-[color:var(--text)]",
        "active": "bg-[color:var(--elevated)] text-[color:var(--text)] shadow-[var(--glow_aqua)]",
        "disabled": "opacity-50 cursor-not-allowed"
      },
      "grouping": "Games (Originals) / Klassiker / Konto / Admin",
      "data_testid": {
        "nav": "sidebar-nav",
        "item": "sidebar-nav-item-<route>"
      }
    },

    "chat_panel": {
      "bubble_styles": {
        "self": "bg-[color:var(--elevated)] border border-[color:var(--border)]",
        "others": "bg-[color:var(--card)] border border-[color:var(--border_subtle)]"
      },
      "message_meta": "text-xs text-[color:var(--muted)]",
      "input": "Input + send Button (icon-only) with focus ring aqua",
      "polling_hint": "Show subtle 'Live' dot with pulse-dot animation",
      "data_testid": {
        "panel": "community-chat-panel",
        "input": "community-chat-input",
        "send": "community-chat-send-button"
      }
    },

    "cards": {
      "base": "bg-[color:var(--card)] border border-[color:var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]",
      "hover": "hover:border-[color:rgba(127,231,214,0.35)] hover:shadow-[var(--glow_aqua)]",
      "featured": "ring-1 ring-[color:rgba(231,199,122,0.22)] shadow-[var(--glow_gold)]",
      "no_transparency_rule": "Cards/Modals niemals bg-transparent; immer solide card/surface Farben"
    },

    "buttons": {
      "shape": "Luxury/Elegant: rounded-xl (10–14px) oder pill für primäre CTAs",
      "variants": {
        "primary": {
          "bg": "bg-[color:var(--gold)]",
          "fg": "text-[color:var(--primary_fg)]",
          "hover": "hover:brightness-[1.03]",
          "active": "active:scale-[0.98]",
          "focus": "focus-visible:ring-2 focus-visible:ring-[color:var(--focus_ring)]"
        },
        "secondary": {
          "bg": "bg-[color:var(--elevated)]",
          "fg": "text-[color:var(--text)]",
          "border": "border border-[color:var(--border)]",
          "hover": "hover:border-[color:rgba(231,199,122,0.35)]"
        },
        "ghost": {
          "bg": "bg-transparent",
          "fg": "text-[color:var(--text_2)]",
          "hover": "hover:bg-[color:rgba(127,231,214,0.10)] hover:text-[color:var(--text)]"
        },
        "danger": {
          "bg": "bg-[color:var(--danger)]",
          "fg": "text-white",
          "hover": "hover:brightness-[1.03]"
        }
      },
      "motion": "transition-colors duration-200 + active scale only on press (no transition:all)",
      "data_testid": "<context>-<action>-button"
    },

    "inputs_tabs_pills": {
      "input": {
        "style": "bg-[color:var(--surface_2)] border border-[color:var(--border)] rounded-xl focus-visible:ring-2 focus-visible:ring-[color:var(--focus_ring)]",
        "number": "Use font-mono for bet amounts",
        "data_testid": "<context>-<field>-input"
      },
      "tabs": {
        "component": "Tabs",
        "style": "TabsList bg-[color:var(--surface)] border border-[color:var(--border)] rounded-full p-1",
        "tab": "rounded-full data-[state=active]:bg-[color:var(--elevated)] data-[state=active]:shadow-[var(--glow_aqua)]",
        "data_testid": "<context>-mode-tabs"
      },
      "pills_badges": {
        "badge": "Badge component; use mono for multipliers",
        "win_pill": "bg-[color:rgba(46,242,165,0.14)] text-[color:var(--win)] border border-[color:rgba(46,242,165,0.25)]",
        "loss_pill": "bg-[color:rgba(255,77,109,0.12)] text-[color:var(--danger)] border border-[color:rgba(255,77,109,0.22)]",
        "neutral_pill": "bg-[color:rgba(127,231,214,0.10)] text-[color:var(--text_2)] border border-[color:rgba(127,231,214,0.18)]"
      }
    },

    "modals": {
      "components": ["Dialog", "Sheet (mobile)", "Drawer (mobile quick actions)"] ,
      "style": {
        "overlay": "bg-black/70 backdrop-blur-[2px]",
        "content": "bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl shadow-[var(--elevated)]",
        "header": "Fraunces title + muted subtitle",
        "footer": "Primary CTA right, secondary left"
      },
      "auth_modal": {
        "tabs": "Login / Registrieren",
        "data_testid": "auth-modal"
      },
      "deposit_modal": {
        "note": "Demo Top-up: klare Presets (10k/50k/100k) + custom",
        "data_testid": "deposit-modal"
      }
    },

    "tables_feeds": {
      "row": "hover:bg-[color:rgba(127,231,214,0.06)]",
      "win_loss": "Use win/danger pills; multiplier in mono",
      "empty_state": "Skeleton + 'Noch keine Runden' with CTA",
      "data_testid": "live-feed-table"
    },

    "mobile_bottom_nav": {
      "component": "NavigationMenu or custom with Button + Tooltip",
      "style": "fixed bottom-0 inset-x-0 bg-[color:var(--surface)] border-t border-[color:var(--border)]",
      "items": ["Lobby", "Crash", "Dice", "Mines", "Profil"],
      "data_testid": "mobile-bottom-nav"
    }
  },

  "game_specific_specs": {
    "crash": {
      "canvas": {
        "background": "solid bg (no gradients) + subtle star noise overlay",
        "curve": "aqua stroke with soft glow; thickness 2.5–3px",
        "rocket": "slight bob only; avoid jitter by decoupling bob animation from position updates",
        "beam": "win green (#2EF2A5) with alpha falloff; if beam stops: ensure beam length tied to current tick not timeouts",
        "crash_event": "screen shake 120ms + red flash vignette 180ms"
      },
      "bet_panel": {
        "tabs": "Manual / Auto",
        "controls": ["Bet amount", "Auto cashout", "Quick bets (25/50/100/Max)", "Bet / Cashout button"],
        "button_states": {
          "waiting": "Primary gold: 'Setzen'",
          "running": "Secondary: 'Cashout' with win glow",
          "crashed": "Danger: 'Abgestürzt' disabled 1.2s then reset"
        },
        "data_testid": {
          "bet_button": "crash-bet-button",
          "cashout_button": "crash-cashout-button",
          "auto_cashout": "crash-auto-cashout-input"
        }
      },
      "history_pills": "last 12 multipliers as pills; >2x aqua, >10x gold outline, crash red for <1.2x"
    },

    "dice": {
      "slider": {
        "component": "shadcn Slider",
        "track": "bg-[color:rgba(106,168,255,0.18)]",
        "range": "bg-[color:rgba(106,168,255,0.55)]",
        "thumb": "bg-[color:var(--gold)] shadow-[var(--glow_gold)]",
        "marker": "vertical line at target with mono label",
        "data_testid": "dice-target-slider"
      },
      "controls": {
        "over_under": "ToggleGroup (Over/Under)",
        "readouts": "Win chance + multiplier in mono",
        "roll": "Primary button; on roll: 3-step animation (anticipation 120ms, roll 420ms, settle 180ms)"
      },
      "results_strip": "last 10 rolls as small chips; win green outline, loss red outline"
    },

    "mines": {
      "grid": {
        "size": "5x5",
        "tile_idle": "bg-[color:var(--card_2)] border border-[color:var(--border_subtle)] rounded-xl",
        "tile_hover": "hover:border-[color:rgba(127,231,214,0.35)] hover:shadow-[var(--glow_aqua)]",
        "tile_revealed_gem": "bg-[color:rgba(46,242,165,0.14)] border-[color:rgba(46,242,165,0.28)]",
        "tile_revealed_mine": "bg-[color:rgba(255,77,109,0.14)] border-[color:rgba(255,77,109,0.28)]",
        "tile_disabled": "opacity-60 cursor-not-allowed"
      },
      "controls": {
        "mines_count": "Select",
        "multiplier": "mono big number",
        "cashout": "Primary gold; becomes win green glow when profitable",
        "data_testid": {
          "grid": "mines-grid",
          "cashout": "mines-cashout-button"
        }
      }
    },

    "coinflip": {
      "coin": {
        "tech": "React Three Fiber optional; fallback CSS 3D transform",
        "faces": {
          "heads": "gold face with subtle engraving lines",
          "tails": "aqua face with subtle engraving lines"
        },
        "flip_motion": "easeOutCubic 900ms, 3–5 rotations; settle with tiny bounce",
        "data_testid": "coinflip-coin"
      },
      "controls": {
        "pick": "Heads/Tails segmented control",
        "payout": "1.96x pill",
        "streak": "Double / Take buttons",
        "data_testid": {
          "pick": "coinflip-pick-toggle",
          "flip": "coinflip-flip-button"
        }
      }
    },

    "roulette": {
      "wheel": "SVG wheel with crisp strokes; bets grid uses Card + Badge",
      "data_testid": "roulette-wheel"
    },

    "blackjack": {
      "table": "felt green surface (solid) with gold separators; cards with subtle shadow",
      "actions": "Hit/Stand/Double/Split as secondary buttons; primary for 'Deal'",
      "data_testid": "blackjack-table"
    },

    "sweet_bonanza": {
      "rule": "Candy visuals remain bright; wrap in shell card with border tokens only",
      "data_testid": "sweet-bonanza-game"
    }
  },

  "motion_microinteractions": {
    "libraries": {
      "framer_motion": "Use for page transitions, hover lift, win/lose feedback",
      "optional": {
        "react_three_fiber": "Only for Coinflip 3D coin; provide fallback",
        "lottie": "Optional for subtle win confetti (small area only)"
      }
    },
    "principles": {
      "durations_ms": { "fast": 140, "base": 220, "slow": 420 },
      "easing": {
        "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
        "out": "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      "hover": "Cards lift translateY(-2px) with shadow increase; Buttons brightness + tiny translateY(-1px)",
      "press": "scale(0.98) 80ms",
      "page_transition": "fade + slight y (8px) on enter; keep subtle",
      "win_feedback": "green glow pulse around bet panel + sonner toast",
      "lose_feedback": "red vignette flash 160ms + shake 90ms (only canvas)"
    },
    "crash_animation_fix_notes": {
      "wobble": "Rocket bob animation must not fight with physics position. Apply bob as separate transform layer (CSS translateY) while canvas uses stable coordinates.",
      "beam_stops": "Beam length/alpha should be derived from current tick and rocket velocity; avoid setInterval drift/timeouts. Recompute each frame.",
      "no_transition_all": "Never use transition: all on rocket/beam elements; it causes jitter when transforms update."
    }
  },

  "states": {
    "loading": {
      "use": "Skeleton component",
      "style": "skeleton bg uses surface_2; shimmer subtle",
      "data_testid": "loading-skeleton"
    },
    "empty": {
      "copy_de": "Noch nichts hier – starte eine Runde.",
      "cta": "Zur Lobby",
      "style": "Card with icon + muted text",
      "data_testid": "empty-state"
    },
    "error": {
      "style": "Alert component (destructive) with retry button",
      "data_testid": "error-state"
    }
  },

  "accessibility": {
    "contrast": "Text on card/surface must meet WCAG AA; avoid pure white on pure black for long reading—use #EEF0FF.",
    "focus": "Always visible focus ring (aqua) on keyboard navigation.",
    "reduced_motion": "Respect prefers-reduced-motion: disable shakes, reduce glows.",
    "hit_targets": "Min 44px touch targets on mobile bottom nav + bet buttons.",
    "aria": "Dialogs/Sheets must have titles; icon-only buttons need aria-label."
  },

  "image_urls": {
    "background_textures": [
      {
        "category": "app-shell-noise",
        "description": "Subtle grain/space texture for lobby hero background overlay (opacity 0.08–0.12).",
        "url": "https://images.unsplash.com/photo-1557688543-4e2f83d6796b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "panel-texture",
        "description": "Velvet-like blue texture for optional blackjack felt backdrop reference (use as inspiration, not full-bleed).",
        "url": "https://images.unsplash.com/photo-1541763029361-21b1788343db?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "gold-bokeh",
        "description": "Warm gold bokeh texture for tiny decorative accent in hero only (max 20% viewport).",
        "url": "https://images.unsplash.com/photo-1584574464778-d1bcf6093351?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "libraries_installation": {
    "optional_react_three_fiber_coinflip": {
      "install": "npm i three @react-three/fiber @react-three/drei",
      "usage_note": "Only for Coinflip 3D coin. Provide CSS 3D fallback if WebGL fails or prefers-reduced-motion is set."
    }
  },

  "instructions_to_main_agent": {
    "token_remap_strategy": [
      "Replace existing night-* token usage by mapping to new CSS variables (bg/surface/card/elevated/border).",
      "Update index.css :root HSL tokens to match this palette; keep dark theme default.",
      "Update font imports: remove Outfit/Plus Jakarta/JetBrains; add Fraunces + IBM Plex Sans/Mono.",
      "Ensure modals/cards are solid backgrounds (no transparency).",
      "Add data-testid to every interactive element and key info readout (balance, multipliers, bet buttons, sliders, grid tiles, chat send)."
    ],
    "pages_to_touch": [
      "/ Lobby",
      "/crash",
      "/dice",
      "/mines",
      "/coinflip",
      "/roulette",
      "/blackjack",
      "/sweet-bonanza",
      "/profile",
      "/admin",
      "AuthModal",
      "DepositModal",
      "Shell: Topbar/Sidebar/ChatPanel/MobileNav"
    ],
    "functional_no_dead_ends": [
      "Every nav item must route to a working page.",
      "Every CTA must open a real modal or perform an action.",
      "Live feed + leaderboard must show real data or a clear empty state with retry."
    ],
    "js_file_convention": {
      "note": "Project uses .jsx/.js. Keep components in .jsx and pages in .js; named exports for components, default export for pages.",
      "example_data_testid": "<context>-<role>-<type> e.g. data-testid=\"dice-roll-button\""
    }
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
