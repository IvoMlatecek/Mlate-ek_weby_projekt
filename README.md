# FreeGamesIndex

Toto je můj školní projekt. Udělal jsem webovou aplikaci kde si můžeš procházet free-to-play hry, ukládat si oblíbené a psát komentáře. Myslím že je docela cool.

## Co to dělá

Je to v podstatě databáze free her kde si můžeš filtrovat podle žánru nebo platformy, hledat konkrétní hry a koukat na detaily jako screenshoty nebo gameplay video. Když se přihlásíš tak si můžeš ukládat oblíbené hry a psát k nim komentáře s hodnocením od 1 do 10.

## Struktura projektu

```
├── index.html      – HTML struktura celé stránky
├── style.css       – všechny styly a responzivní design
├── app.js          – veškerá JavaScript logika
├── sw.js           – Service Worker pro PWA a offline režim
├── manifest.json   – PWA manifest
├── icons/          – ikony pro PWA
└── README.md       – toto
```

## API endpointy

Používám FreeToGame public API, kvůli CORS to musím někdy posílat přes proxy na allorigins.win.

| Metoda | Endpoint | K čemu to je |
|--------|----------|--------------|
| GET | `https://www.freetogame.com/api/games` | načte všechny hry |
| GET | `https://www.freetogame.com/api/games?platform=pc` | jenom PC hry |
| GET | `https://www.freetogame.com/api/games?platform=browser` | jenom browserové hry |
| GET | `https://www.freetogame.com/api/games?category=shooter` | hry podle žánru |
| GET | `https://www.freetogame.com/api/game?id=452` | detail jedné konkrétní hry |

## Jak to funguje

### Procházení her
Načte se seznam her z API a zobrazí se jako mřížka karet. Dají se filtrovat podle platformy a žánru, řadit čtyřmi způsoby a vyhledávat fulltext přes název, vývojáře nebo popis. Filtrování podle žánru a platformy jde přímo přes API parametry, řazení a vyhledávání se dělá na straně klienta.

### Detail hry
Když klikneš na hru tak se otevře panel zprava. Tam je thumbnail, základní info, pak se donačte plný popis, screenshoty, gameplay video z YouTube a minimální systémové požadavky. Na screenshoty se dá kliknout a zobrazí se fullscreen lightbox kde se dá přepínat šipkami nebo klávesnicí. Video se dá dát do fullscreenu tlačítkem.

### Oblíbené
Přihlášení uživatelé si můžou ukládat hry do oblíbených. Ty se ukládají do Firebase Firestore takže jsou svázané s účtem a nezmizí po odhlášení. Každý uživatel vidí jen svoje oblíbené.

### Komentáře a hodnocení
Po přihlášení se dá ke každé hře napsat komentář a dát hodnocení od 1 do 10 hvězdiček. Komentáře vidí všichni i bez přihlášení. Ukládají se do Firebase Firestore. Zobrazuje se průměrné hodnocení.

### Přihlášení
Funguje přes Firebase Authentication s emailem a heslem. Při registraci si nastavíš uživatelské jméno které se pak zobrazuje u komentářů. Login a registrace jsou v jednom modálním okně s přepínačem.

### PWA
Aplikace se dá nainstalovat jako PWA na plochu nebo do telefonu. Service Worker cachuje statické soubory takže základní věci fungují i offline, hry se načítají z localStorage cache.

### localStorage
Hry se po načtení uloží do `localStorage` pod klíčem `fgt_hry_cache` jako záloha pro případ že není internet.

## Firebase Firestore struktura

```
uzivatele/
  {uid}/
    oblibene/
      {gameId}: { idHry: number }

hry/
  {gameId}/
    komentare/
      {docId}: { uzivatel, text, hodnoceni, datum }
```

## Use-case diagram

```
┌─────────────────────────────────────────────────┐
│                 FreeGamesIndex                  │
│                                                 │
│  [Nepřihlášený uživatel]                        │
│    → Procházet hry                              │
│    → Filtrovat podle platformy a žánru          │
│    → Vyhledávat hry                             │
│    → Zobrazit detail hry                        │
│    → Zobrazit screenshoty a video               │
│    → Číst komentáře a hodnocení                 │
│                                                 │
│  [Přihlášený uživatel]                          │
│    → Vše výše +                                 │
│    → Ukládat hry do oblíbených                  │
│    → Přidat komentář                            │
│    → Ohodnotit hru (1–10)                       │
└─────────────────────────────────────────────────┘
```

## Technologie

- Vanilla JavaScript ES2020+ (žádný framework)
- CSS proměnné, Flexbox, Grid
- Firebase Authentication + Firestore
- FreeToGame Public API
- PWA, Service Worker, localStorage
- IBM Plex Mono + IBM Plex Sans (Google Fonts)