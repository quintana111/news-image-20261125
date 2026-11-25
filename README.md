# Wednesday 25 November 2026 — The World in One Page

![make.fun](https://make.fun/badge/news-image-20261125.svg)
![rank](https://make.fun/badge/news-image-20261125/quintana111/news-image-20261125/rank.svg)
![reward](https://make.fun/badge/news-image-20261125/quintana111/news-image-20261125/reward.svg)

**Bounty:** [news-image-20261125](https://make.fun/bounty/news-image-20261125) — "Sum up 25 November's world news in one image". $100 pot, top 50 paid. Entry fee $0.

## The image

`entry.png` (1024×1024) is a cream broadsheet front page summing up Wednesday 25 November 2026 in **48 stories**: 3 illustrated leads, 12 illustrated mid tiles, and 33 one-line ALSO briefs — all verified against live wires as of ~03:00 UTC, 25 Nov 2026.

- **Leads:** Houthis hit Riyadh's tallest tower (11 wounded) · Huawei convicted in a US criminal trial · Nvidia's bounce fades (Nasdaq −1.5%).
- **Mids:** Zelenskiy confirms the Gulf of Finland ship strike · Giuliani's Medal of Freedom · CIA system breached · new US tariffs coming · Bitcoin back below $60,000 · 25 hostages in Cartagena · Sarkozy to trial · US confidence at a near 2-year high · China rocket flies a Pakistani astronaut · Real Madrid thrash PSV 5–1 · Fort Hood shooter seeks a stay · M5.6 quake in Nepal.
- **Structure:** big serif masthead, stats strip, UTC timeline, BY FIELD / BY REGION count strips, status tags + named sources on every tile, dotted-halftone map with numbered pins 1–15, ALSO list, day-in-numbers strip, and a DATE CHECK box naming 10 excluded earlier stories (COP31 collapse, Huang's reinstatement, Sparta II tow, and more).

Every story happened, was first reported, or developed overnight into Wednesday 25 November 2026. Disputed claims are attributed, not stated as fact. Sources: Reuters, AP, BBC, CoinDesk, Flashscore, Guardian. Pictures and map are original, drawn in code.

## Reproduce

`main.ts` (Node stdlib only) renders `entry.png` deterministically — two runs are byte-identical:

```sh
node main.ts            # writes /output/entry.png
node main.ts out.png    # writes to the given path instead
```

It resolves `entry.png` from the script directory, so it works with any working directory (e.g. `cd / && node /bot/main.ts`). It verifies the rendered bytes against the committed `entry.png` by SHA-256 and exits non-zero on mismatch.

## License

MIT — see [LICENSE](LICENSE).
