# FreeGamesIndex

Webová aplikace umožňující procházení a správu databáze free-to-play her.

## Popis aplikace

FreeGamesIndex je jednostránková webová aplikace poskytující uživatelům přístup k databázi free-to-play her prostřednictvím veřejného REST API. Aplikace umožňuje filtrování a vyhledávání her, správu osobního seznamu oblíbených položek a vkládání hodnocení a komentářů. Přístup k funkcím správy dat je podmíněn autentizací uživatele.

## Struktura projektu

```
├── index.html      – struktura a sémantické značkování stránky
├── style.css       – vizuální zpracování a responzivní rozvržení
├── app.js          – veškerá aplikační logika v jazyce JavaScript
├── sw.js           – Service Worker zajišťující funkci PWA a offline režim
├── manifest.json   – konfigurační soubor PWA
├── icons/          – ikony aplikace pro účely instalace PWA
└── README.md       – projektová dokumentace
```

## Použité API endpointy

Zdrojem herních dat je veřejné REST API provozované službou FreeToGame. Z důvodu omezení CORS je v případě nedostupnosti přímého přístupu využíván transparentní proxy server `api.allorigins.win`.

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `https://www.freetogame.com/api/games` | Načtení seznamu všech her |
| GET | `https://www.freetogame.com/api/games?platform={pc\|browser}` | Filtrování podle platformy |
| GET | `https://www.freetogame.com/api/games?category={žánr}` | Filtrování podle žánru |
| GET | `https://www.freetogame.com/api/game?id={id}` | Načtení detailu konkrétní hry |

## Popis funkcionality

### Procházení her
Aplikace načítá seznam her ze vzdáleného REST API a zobrazuje jej ve formě mřížky karet. Uživatel má k dispozici filtrování podle platformy a žánru, řazení čtyřmi způsoby a fulltextové vyhledávání v názvu, jménu vývojáře a popisu. Filtrování podle žánru a platformy je realizováno prostřednictvím parametrů API; řazení a vyhledávání probíhají na straně klienta.

### Detail hry
Po výběru herní položky se zobrazí postranní panel obsahující rozšířený popis, screenshoty, video záznam hraní a minimální systémové požadavky. Screenshoty jsou zobrazitelné ve fullscreen lightboxu s navigací prostřednictvím ovládacích prvků nebo klávesnice.

### Správa oblíbených položek
Přihlášený uživatel může zařazovat hry do seznamu oblíbených. Data jsou ukládána v databázi Firebase Firestore pod identifikátorem uživatelského účtu, čímž je zajištěna jejich dostupnost napříč zařízeními a relacemi.

### Komentáře a hodnocení
Přihlášený uživatel může ke každé hře připojit textový komentář a číselné hodnocení v rozsahu 1–10. Komentáře jsou veřejně čitelné bez nutnosti přihlášení. Data jsou ukládána v databázi Firebase Firestore. V detailu hry je zobrazováno průměrné hodnocení vypočítané ze všech dostupných hodnocení.

### Autentizace uživatelů
Autentizace je zajištěna prostřednictvím služby Firebase Authentication s metodou e-mail a heslo. Při registraci si uživatel zvolí zobrazované jméno, které je uloženo v profilu Firebase Auth jako `displayName`. Přihlášení a registrace jsou dostupné prostřednictvím modálního dialogu s přepínačem režimu.

### Lokální úložiště
Po úspěšném načtení jsou herní data uložena do `localStorage` pod klíčem `fgt_hry_cache`. Tato data jsou využívána jako záložní zdroj v případě nedostupnosti sítě.

### PWA
Aplikace splňuje požadavky progresivní webové aplikace. Service Worker (`sw.js`) zajišťuje ukládání statických souborů do mezipaměti a jejich dostupnost v offline režimu. Soubor `manifest.json` umožňuje instalaci aplikace na plochu zařízení.

## Datová struktura Firebase Firestore

```
uzivatele/
  {uid}/
    oblibene/
      {gameId}: { idHry: number }

hry/
  {gameId}/
    komentare/
      {docId}: {
        uzivatel: string,
        text: string,
        hodnoceni: number | null,
        datum: string (ISO 8601)
      }
```

## Pravidla přístupu Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hry/{gameId}/komentare/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /uzivatele/{userId}/oblibene/{doc} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

## Use-case diagram

```
┌─────────────────────────────────────────────────────┐
│                   FreeGamesIndex                    │
│                                                     │
│  [Nepřihlášený uživatel]                            │
│    → Procházení seznamu her                         │
│    → Filtrování podle platformy a žánru             │
│    → Fulltextové vyhledávání                        │
│    → Zobrazení detailu hry                          │
│    → Zobrazení screenshotů a videa                  │
│    → Čtení komentářů a hodnocení                    │
│                                                     │
│  [Přihlášený uživatel]                              │
│    → Veškerá výše uvedená funkcionalita             │
│    → Správa seznamu oblíbených her                  │
│    → Vkládání komentářů                             │
│    → Hodnocení her (1–10)                           │
└─────────────────────────────────────────────────────┘
```

## Použité technologie

| Technologie | Účel |
|---|---|
| Vanilla JavaScript ES2020+ | Veškerá aplikační logika bez použití frameworku |
| CSS Custom Properties, Flexbox, Grid | Vizuální zpracování a responzivní rozvržení |
| Firebase Authentication | Správa uživatelských účtů |
| Firebase Firestore | Perzistentní úložiště komentářů a oblíbených položek |
| FreeToGame Public API | Zdroj herních dat |
| localStorage | Lokální mezipaměť herních dat pro offline režim |
| Service Worker, manifest.json | Implementace PWA |
| IBM Plex Mono, IBM Plex Sans | Typografie (Google Fonts) |
