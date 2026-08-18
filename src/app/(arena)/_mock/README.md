# Mock data — replace before launch

Every export in this directory is placeholder data lifted out of the Figma
design export so the arena screens could be built design-first. **None of it
comes from the backend.** It exists so the screens have something to render
while the visual work lands ahead of the data wiring.

Each file names the real source its data should come from. When a screen gets
wired up (P4/P6), delete the import here and the corresponding export — when
this directory is empty, the wiring is done.

| File          | Feeds                           | Real source                                      |
| ------------- | ------------------------------- | ------------------------------------------------ |
| `rooms.ts`    | `/rooms`                        | `GET /rooms` on the game server                  |
| `players.ts`  | `/leaderboards`, `/friends`     | leaderboard + friends endpoints                  |
| `matches.ts`  | `/home`                         | `wallet.matchHistory` + `POST /matches/detail`   |

The mock player is always `AlphaWolf` — grep for that name to find every spot
still rendering a fake identity rather than the signed-in one.
