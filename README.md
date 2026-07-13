# CalcAmp

Plovoucí průhledná **kalkulačka** s vestavěným **MP3 přehrávačem ve stylu Winampu**.
Postavené na Electronu, jedna codebase pro **Linux, Windows i macOS**.

Okno je frameless, průhledné a vždy navrchu — vypadá jako kalkulačka, šipka `▶`
v dolní liště ji rozbalí a vedle vysune plnohodnotný přehrávač s vizualizérem.

## Funkce

- Plnohodnotná kalkulačka (myš i klávesnice), zelený LCD, oddělení tisíců mezerou.
- Okno se dynamicky mění přesně podle obsahu (sbalené = jen kalkulačka).
- MP3 přehrávač: transport, VOLUME/BALANCE (Web Audio), playlist, nahrávání souborů.
- Vizualizér s 5 styly: SPEKTRUM, ZRCADLO, BLOKY, VLNA, NORA.
- Fullscreen vizualizér (klik = změna stylu, Esc = zpět).
- Playlist se pamatuje mezi spuštěními.

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

Instalátory se objeví v `dist/`. Cross-platform buildy zajišťuje i GitHub Actions
(`.github/workflows/build.yml`) — každý OS se sestaví na vlastním runneru, na
tag `v*` se vytvoří Release s balíčky ke stažení.

## Poznámky k platformám

- Na **Linuxu** se vypíná HW akcelerace (workaround na pád GPU procesu u
  průhledného okna); na Windows/macOS zůstává zapnutá.
- Podpis kódu zatím není nastavený — nepodepsané buildy vyvolají varování
  Windows SmartScreen / macOS Gatekeeper.

## Licence

MIT — viz [LICENSE](LICENSE).
