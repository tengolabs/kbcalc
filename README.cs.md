# CalcAmp

*Prefer English? → [README.md](README.md)*

Plovoucí průhledná **kalkulačka** s vestavěným **MP3 přehrávačem ve stylu Winampu**.
Postavené na Electronu, jedna codebase pro **Linux, Windows i macOS**.

![CalcAmp — kalkulačka s rozbaleným přehrávačem](docs/screenshot.png)

Okno je frameless a průhledné — na první pohled jen kalkulačka, šipka `▶`
v dolní liště vedle ní vysune plnohodnotný přehrávač s vizualizérem.

## Funkce

**Kalkulačka**
- Myš i klávesnice (číslice, `+ - * /`, `Enter` = `=`, `Backspace`,
  `Esc`/`C` = smazat, `.` nebo `,` jako desetinný oddělovač).
- Zelený LCD displej, oddělení tisíců mezerou.
- Záměrně se chová jako windowsovská *Standardní* kalkulačka:
  vyhodnocení zleva doprava (`2 + 3 × 4 = 20`) a kontextová procenta
  (`200 + 10 % = 220`, `200 × 10 % = 20`).
- Okno se dynamicky mění přesně podle obsahu — sbalené je *jen* kalkulačka
  s mini ovládáním přehrávání v dolní liště.

**Přehrávač**
- Transport (předchozí / play–pauza / stop / další / eject = přidat soubory).
- VOLUME a BALANCE přes Web Audio.
- **Víc pojmenovaných playlistů**: nový, inline přejmenování, smazání,
  přepínání v hlavičce. Playlisty přežijí restart (ukládají se cesty;
  audio se načítá líně — v paměti je max jedna skladba).
- **Drag & drop**: soubory → do aktuálního playlistu; složka → nový playlist
  pojmenovaný po ní (rekurzivně, jen audio, seřazeno).
- Mrtvé/smazané soubory se při přehrávání automaticky přeskočí.
- Formáty: mp3, m4a, ogg/oga, wav, flac, aac, opus, wma.

**Vizualizér**
- 5 stylů: SPEKTRUM, ZRCADLO, BLOKY, VLNA, NORA — klik na plochu nebo
  tlačítko stylu přepíná.
- Fullscreen (`⛶`): klik = změna stylu, `Esc` = zpět.

**Okno**
- Vždy navrchu (`◉`), minimalizace, zavření — vlastní ovládání bez OS lišty.

## Instalace

Instalátory jsou na stránce [Releases](../../releases):
Windows (NSIS + portable exe), Linux (AppImage + deb, x64), macOS (dmg/zip, Apple Silicon).

Buildy zatím **nejsou podepsané** — Windows SmartScreen / macOS Gatekeeper
při prvním spuštění varují (Windows: *Další informace → Přesto spustit*).

## Vývoj

```bash
npm install
npm start
```

## Build instalátorů

```bash
npm run dist          # aktuální OS
npm run dist:linux    # AppImage + deb
npm run dist:win      # NSIS instalátor + portable exe
npm run dist:mac      # dmg + zip
```

Instalátory se objeví v `dist/`. CI (`.github/workflows/build.yml`) staví
všechny tři OS na vlastních runnerech; tag `v*` vytvoří Release s balíčky.

## Poznámky k platformám

- Na **Linuxu** se vypíná HW akcelerace (workaround na pád GPU procesu u
  průhledného okna); Windows/macOS ji mají zapnutou.
- `--no-sandbox` jen na Linuxu.

## Bezpečnostní model

- Renderer: `contextIsolation: true`, `nodeIntegration: false`.
- Preload most vystavuje minimum: ovládání okna + dvě souborové funkce pro
  playlisty. `fs:read` čte jen skutečné audio soubory (allow-list přípon,
  rozřešené symlinky, jen regulérní soubory), `fs:expand` nesleduje symlinky
  a má strop hloubky rekurze.
- Restriktivní CSP (`connect-src 'self'`; média jen přes `blob:`).
- Navigace a `window.open` jsou v main procesu zakázané.

## Licence

[MIT](LICENSE) © 2026 Richard (tengosro)
