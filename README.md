# Stickman Runner

An endless runner built with plain HTML5 Canvas and ES modules. No game
framework, no sprite sheets, no audio files: the stickman, the world and every
sound effect are generated at runtime.

- **Title:** Stickman Runner
- **Category:** Action / Runner
- **Description:** Run, jump, slide and survive as long as possible in this fast-paced endless stickman runner.
- **Controls:** Keyboard + mobile touch
- **Build size:** ~70 kB of JavaScript (~21 kB gzipped), one runtime dependency (the GameHub Ad SDK)

## Why Canvas instead of Phaser

Phaser would add roughly 1 MB before the first pixel is drawn. This game needs
one scrolling layer, a few dozen pooled rectangles and a stickman made of
lines, so the whole engine layer here is about 300 lines in `src/game.js`. That
keeps first load fast on mobile data, which is what a portal like GameHub is
judged on. The project still follows the Phaser habits that matter: scenes with
`enter`/`exit`/`update`/`render`, pooled game objects, and systems that own one
concern each.

## Quick start

```bash
npm install        # installs Vite (dev dependency only)
npm run dev        # http://localhost:5173
npm test           # headless play-through tests in Node
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run build:single   # fold dist/ into one HTML file (dist-single/)
```

The only runtime dependency is `@gamehubsdk/gamehub-ad-sdk`. Setting
`CONFIG.ads.enabled = false` in `src/config.js` switches off every ad code path;
the game then behaves exactly as it did before ads existed.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Jump | Space, ↑, W | Tap or swipe up |
| Double jump | Press jump again in mid-air | Tap again in mid-air |
| Slide | ↓, S | Swipe down |
| Fast fall | Hold ↓ in the air | Hold after a swipe down |
| Pause | P or Esc | Pause button, top right |
| Restart | R | Restart button |

Holding jump longer gives a higher jump; releasing early cuts it short.
There is a hard two-jump limit, refreshed only on landing.

## Project structure

```
stickman-runner/
├── index.html              Shell, metadata and all UI styling
├── package.json
├── vite.config.js
├── game.json               Portal metadata (title, category, events)
├── README.md
├── src/
│   ├── main.js             Entry point, exposes window.StickmanRunner
│   ├── game.js             Canvas, resize/letterbox, frame loop, scene stack
│   ├── config.js           Every tunable number
│   ├── scenes/
│   │   ├── Scene.js        Scene contract
│   │   ├── BootScene.js    Loading screen
│   │   ├── MenuScene.js    Main menu + how to play
│   │   ├── GameScene.js    The run: spawning, effects, pause, death
│   │   ├── GameOverScene.js
│   │   └── SettingsScene.js
│   ├── player/
│   │   ├── Player.js            State machine and physics
│   │   ├── PlayerController.js  Input intents to player actions
│   │   └── PlayerAnimation.js   Procedural stickman drawing
│   ├── obstacles/
│   │   ├── Obstacle.js          Pooled base class
│   │   ├── ObstacleManager.js   Pools, patterns, difficulty gating
│   │   ├── Spike.js  Rock.js  Fire.js
│   │   ├── LowBar.js            Slide-only beam
│   │   ├── MovingObstacle.js    Patrolling drone
│   │   ├── FallingObstacle.js   Telegraphed drop
│   │   └── Gap.js               Hole in the ground
│   ├── collectibles/
│   │   ├── Coin.js
│   │   └── PowerUp.js
│   ├── systems/
│   │   ├── ScoreSystem.js
│   │   ├── DifficultySystem.js
│   │   ├── CollisionSystem.js
│   │   ├── AudioSystem.js       WebAudio synthesis, music sequencer
│   │   └── SaveSystem.js        Guarded localStorage
│   ├── ui/
│   │   ├── HUD.js               Canvas HUD + pause button
│   │   ├── MainMenu.js  PauseMenu.js  GameOverUI.js
│   ├── utils/
│   │   ├── Input.js             Keyboard, mouse, touch, swipe
│   │   ├── Random.js            Seeded RNG
│   │   ├── Constants.js
│   │   └── dom.js
│   ├── world/
│   │   ├── Background.js        Parallax sky, clouds, hills, trees
│   │   └── Ground.js            Ground segments around gaps
│   └── integration/
│       ├── GameHub.js           Optional postMessage bridge
│       └── AdSystem.js          GameHub Ad SDK wrapper (banner / interstitial / rewarded)
├── tools/build-single.mjs
├── tests/                  Headless play-through tests
└── assets/                 images / audio / fonts (empty by design)
```

## Scoring

```
distance score = metres travelled
coin score     = coins × 10
power-up bonus = 250 per pickup
total          = distance + coins + bonus
```

The best run is stored in `localStorage` under `stickman-runner.best`.

## Difficulty

| Distance | Tier | What changes |
| --- | --- | --- |
| 0–500 m | Easy | Single hazards, generous spacing |
| 500–1000 m | Normal | Gaps appear, spike pairs |
| 1000–2000 m | Hard | Patrolling drones, triple spikes |
| 2000 m+ | Extreme | Falling rocks, wide gaps, tightest spacing |

Spacing between hazards is measured in **seconds**, not pixels, so speeding up
never shortens reaction time below the floor in `config.js`. Gap widths are
capped against the current jump arc. The automated test suite plays 15 seeded
runs to 4000 m to prove no generated pattern is impossible.

## Power-ups

| Power-up | Effect | Duration |
| --- | --- | --- |
| Shield | Absorbs exactly one obstacle hit, then it is spent | 12 s or one hit |
| Magnet | Nearby coins fly to the player | 7 s |
| Boost | 1.35× speed | 6 s |

Each shows a labelled timer bar in the HUD and a visual effect on the player.

## Performance notes

- One `requestAnimationFrame` loop; the loop is cancelled entirely while paused
  or hidden, so a backgrounded tab costs nothing.
- Obstacles, gaps, coins and power-ups are pooled and reused. A long run
  allocates no new game objects after warm-up.
- The HUD is drawn on the canvas; the DOM is only touched when a menu opens.
- Device pixel ratio is capped at 2 to protect fill rate on phones.
- Delta time is clamped to 50 ms so a hitch cannot teleport the player through
  an obstacle.
- Every event listener is removable, and `destroy()` unwinds the whole game.

## Responsiveness

Gameplay runs in a fixed 960×540 coordinate space. The canvas is letterboxed
with `scale = min(width/960, height/540)`, so 16:9, 4:3 and tall phone screens
all show the same play field with no stretching. Pointer coordinates are mapped
back into game space, so touch targets stay accurate at any size.

## Deployment

The build output is static. Any of these work:

```bash
npm run build
# then upload the contents of dist/ to:
#   /var/www/gamehub/games/stickman-runner/     (nginx, Apache)
#   an S3 bucket + CloudFront
#   Netlify, Vercel, Cloudflare Pages, GitHub Pages
```

`vite.config.js` sets `base: './'`, so the build runs from any sub-path,
including `https://yourhub.com/games/stickman-runner/`. Nothing in the game
reads from the parent page, so it works standalone or embedded.

Recommended cache headers: `index.html` short or no-cache, `assets/*` immutable
for a year (the filenames are hashed).

## Embedding in GameHub

Host the folder and point an iframe at it:

```html
<iframe
  src="/games/stickman-runner/"
  title="Stickman Runner"
  width="960" height="540"
  allow="autoplay"
  sandbox="allow-scripts allow-same-origin"
  style="border:0; aspect-ratio:16/9; width:100%;"
></iframe>
```

The game posts messages to the parent. Listening is optional.

```js
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.channel !== 'gamehub' || data.game !== 'stickman-runner') return;

  switch (data.event) {
    case 'ready':         break; // the game has booted
    case 'game_started':  break;
    case 'game_paused':   break;
    case 'game_resumed':  break;
    case 'game_over':
      // data.payload = { score, distance, coins, duration }
      recordPlay(data.payload);
      break;
  }
});
```

Every message looks like:

```json
{
  "channel": "gamehub",
  "version": 1,
  "game": "stickman-runner",
  "event": "game_over",
  "payload": { "score": 4820, "distance": 3610, "coins": 121, "duration": 184.6 },
  "at": 1758153600000
}
```

Verify `event.origin` on the host side before trusting the frame.


## Ads: GameHub Ad SDK

The game integrates [`@gamehubsdk/gamehub-ad-sdk`](https://www.npmjs.com/package/@gamehubsdk/gamehub-ad-sdk)
through a single wrapper, `src/integration/AdSystem.js`. Two rules shape it:

1. **No ad ever interrupts a live run.** Banners appear on the main menu and the
   game over screen. Interstitials play between runs. The rewarded ad is
   opt-in, triggered only by the player pressing a button.
2. **Ads are optional at runtime.** If the SDK fails to initialise, the ad API
   is unreachable, or no campaign comes back, every call resolves to `false`
   and the game continues untouched. The automated tests cover that path.

### Placements

| Placement | Type | When |
| --- | --- | --- |
| `main_menu` | Banner | Main menu is open |
| `game_over` | Banner | Game over screen is open |
| `game_over` | Interstitial | Every 3rd restart (`interstitialEveryRuns`) |
| `extra_life` | Rewarded | Player taps "Watch an ad to continue this run" |

The rewarded ad revives the run in place: score, distance and coins carry over,
the track around the player is cleared, and 2.5 s of invincibility plus a fresh
countdown give a fair restart. It can be used once per run.

The SDK resolves `showInterstitial()` / `showRewardedAd()` as soon as the
overlay appears, not when the player closes it, so `AdSystem` listens for
`ad_closed` and `reward_earned` and returns a promise that settles when the
player is genuinely done. Game audio is muted while an overlay is open and
restored afterwards.

### Configuration

Everything lives in `CONFIG.ads` in `src/config.js`:

```js
ads: {
  enabled: true,
  gameId: 'stickman-runner',
  developerId: '',
  apiBaseUrl: '',   // 'https://api.your-gamehub.com'
  adEndpoint: '',   // overrides apiBaseUrl when set
  apiKey: '',       // PUBLIC key only
  testMode: true,   // demo creatives until an ad API is configured
  interstitialCooldownMs: 60000,
  interstitialEveryRuns: 3,
  bannerContainerId: 'gamehub-banner-ad'
}
```

With `testMode: true` and no `apiBaseUrl`, the SDK renders its own test
creative and makes **no network request at all** — useful for checking the
placements before the ad backend exists. Set `apiBaseUrl` (or `adEndpoint`) and
`testMode: false` to serve real campaigns.

The host page can override any of these without a rebuild, which is the usual
way a portal injects per-deployment ids:

```html
<script>
  window.GAMEHUB_AD_CONFIG = {
    gameId: 'game_123',
    developerId: 'developer_456',
    apiBaseUrl: 'https://api.your-gamehub.com',
    apiKey: 'PUBLIC_GAME_KEY',
    testMode: false
  };
</script>
```

Place it before the game's own `<script type="module">` tag.

### Ad backend contract

The SDK POSTs to `{apiBaseUrl}/v1/sdk/ads/next` with
`{ gameId, developerId, type, placementId, pageUrl }` and expects
`{ ok: true, ad: { id, type, title, body, imageUrl, clickUrl, impressionUrl, clickTrackerUrl } }`.
HTML creatives are rendered inside a sandboxed iframe. Full details are in the
package README.

### Banner slot

`index.html` provides `<div id="gamehub-banner-ad">`, so the SDK never injects
a fixed-position element of its own (`autoCreate: false`). The slot stays
hidden unless an ad is actually rendered, and it sits outside the canvas, so it
can never cover gameplay.

## Security

- Scores in `postMessage` and in `localStorage` come from the browser and are
  therefore **untrusted**. Treat them as display values only. A server
  leaderboard needs server-side validation — for example, a signed session per
  run, plausibility checks against duration and distance, or replaying the
  recorded input stream.
- The local best score (`stickman-runner.best`) is deliberately a separate
  concept from any future server leaderboard. Do not sync one into the other.
- Only a **public** game key belongs in `CONFIG.ads.apiKey`. A server secret in
  browser code is readable by every player. Ad requests and optional analytics
  are the only network calls the game makes.
- Ad click destinations come from your ad API, so validate `clickUrl` server
  side before returning a creative.
- The bridge posts to `'*'` because the payload contains no personal data; the
  host is the side that must check the origin.

## Adding another game with the same architecture

1. Copy the folder to `games/<your-game>/` and rename the id in `package.json`,
   `game.json` and `new GameHubBridge('<your-game>')`.
2. Keep `game.js`, `utils/`, `systems/AudioSystem.js`, `systems/SaveSystem.js`
   and `integration/GameHub.js` as they are. They are game-agnostic.
3. Replace the scene bodies. A scene only has to implement `enter`, `exit`,
   `update(dt)`, `render(ctx)` and `destroy()`; register it in the `Game`
   constructor's scene map.
4. Change `GAME_WIDTH` / `GAME_HEIGHT` in `utils/Constants.js` if your game
   wants a different aspect ratio. Everything else scales from those two values.
5. Put per-game numbers in `config.js` rather than in gameplay code, so the new
   game can be balanced without touching logic.
6. Reuse `tests/dom-stub.mjs` to play the new game headlessly in CI.

## Assets and licensing

The GameHub Ad SDK is MIT licensed. All game visuals are drawn procedurally with Canvas 2D paths and all sounds are
synthesised with the Web Audio API. No third-party art, audio, characters,
branding or game code is included. The only external resource is the Chakra
Petch webfont from Google Fonts (SIL Open Font License), which can be swapped
for a system font stack by editing the `<link>` and `font-family` in
`index.html`.
