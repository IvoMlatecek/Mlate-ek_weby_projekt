import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnR7o_UpPGAfO50AX6rPl2Z24vamPE-CY",
  authDomain: "freegames-e588a.firebaseapp.com",
  projectId: "freegames-e588a",
  storageBucket: "freegames-e588a.firebasestorage.app",
  messagingSenderId: "124117602047",
  appId: "1:124117602047:web:1f0b6ece6d2beba1ec06ca"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const API_BASE = 'https://www.freetogame.com/api';
const PROXY = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

let vsechnyHry = [];
let filtrovaneHry = [];
let oblibene = [];
let aktualniUzivatel = null;
let aktualniHra = null;
let vybranéHodnoceni = 0;
let dotazHledani = '';
let rezimRegistrace = false;

const mrizkaHer = document.getElementById('mrizka-her');
const mrizkaOblibenych = document.getElementById('mrizka-oblibenych');
const stavNacitani = document.getElementById('stav-nacitani');
const stavChyby = document.getElementById('stav-chyby');
const zadneVysledky = document.getElementById('zadne-vysledky');
const zadneOblibene = document.getElementById('zadne-oblibene');
const pocetOblibenych = document.getElementById('pocet-oblibenych');

const filtrPlatforma = document.getElementById('filtr-platforma');
const filtrZanr = document.getElementById('filtr-zanr');
const filtrRazeni = document.getElementById('filtr-razeni');

const navProhlizeni = document.getElementById('nav-prohlizeni');
const navOblibene = document.getElementById('nav-oblibene');
const pohledProhlizeni = document.getElementById('pohled-prohlizeni');
const pohledOblibene = document.getElementById('pohled-oblibene');

const prepinacHledani = document.getElementById('prepinac-hledani');
const panelHledani = document.getElementById('panel-hledani');
const vstupHledani = document.getElementById('vstup-hledani');

const tlacitkoAuth = document.getElementById('tlacitko-auth');
const modalPrihlaseni = document.getElementById('modal-prihlaseni');
const zavritModalBtn = document.getElementById('zavrit-modal');
const vstupJmeno = document.getElementById('vstup-jmeno');
const vstupEmail = document.getElementById('vstup-email');
const vstupHeslo = document.getElementById('vstup-heslo');
const odeslatPrihlaseni = document.getElementById('odeslat-prihlaseni');
const chybaModalu = document.getElementById('chyba-modalu');
const nadpisModalu = document.getElementById('nadpis-modalu');
const podnadpisModalu = document.getElementById('podnadpis-modalu');
const prepnoutRegistraci = document.getElementById('prepnout-registraci');

const panelDetailu = document.getElementById('panel-detailu');
const prekrytiPanelu = document.getElementById('prekryti-panelu');
const zavritPanelBtn = document.getElementById('zavrit-panel');
const detailObrazek = document.getElementById('detail-obrazek');
const detailTelo = document.getElementById('detail-telo');

const sekceKomentaru = document.getElementById('sekce-komentaru');
const seznamKomentaru = document.getElementById('seznam-komentaru');
const textKomentare = document.getElementById('text-komentare');
const odeslatKomentar = document.getElementById('odeslat-komentar');
const vyzva = document.getElementById('vyzva-prihlaseni');
const tlacitkoVyzva = document.getElementById('tlacitko-vyzva-prihlaseni');
const hvezdicky = document.getElementById('hvezdicky-hodnoceni');
const hodnotaHodnoceni = document.getElementById('hodnota-hodnoceni');

const notifikace = document.getElementById('notifikace');

onAuthStateChanged(auth, async (uzivatel) => {
  if (uzivatel) {
    aktualniUzivatel = uzivatel;
    oblibene = await nactiOblibeneZFirestore();
  } else {
    aktualniUzivatel = null;
    oblibene = [];
  }
  aktualizujAuthUI();
  aktualizujPocetOblibenych();
  if (vsechnyHry.length > 0) aplikujRazeniAHledani();
});

(function init() {
  nactiHry();

  filtrPlatforma.addEventListener('change', aplikujFiltry);
  filtrZanr.addEventListener('change', aplikujFiltry);
  filtrRazeni.addEventListener('change', aplikujRazeniAHledani);

  navProhlizeni.addEventListener('click', () => zobrazPohled('prohlizeni'));
  navOblibene.addEventListener('click', () => zobrazPohled('oblibene'));

  prepinacHledani.addEventListener('click', prepniHledani);
  vstupHledani.addEventListener('input', priHledani);

  tlacitkoAuth.addEventListener('click', klikAuthTlacitko);
  zavritModalBtn.addEventListener('click', zavriModal);
  modalPrihlaseni.addEventListener('click', (e) => {
    if (e.target === modalPrihlaseni) zavriModal();
  });
  odeslatPrihlaseni.addEventListener('click', odeslatFormular);
  vstupJmeno.addEventListener('keydown', (e) => { if (e.key === 'Enter') vstupEmail.focus(); });
  vstupEmail.addEventListener('keydown', (e) => { if (e.key === 'Enter') vstupHeslo.focus(); });
  vstupHeslo.addEventListener('keydown', (e) => { if (e.key === 'Enter') odeslatFormular(); });
  prepnoutRegistraci.addEventListener('click', prepniRezimModalu);

  zavritPanelBtn.addEventListener('click', zavriPanel);
  prekrytiPanelu.addEventListener('click', zavriPanel);

  odeslatKomentar.addEventListener('click', pridejKomentar);

  tlacitkoVyzva.addEventListener('click', () => {
    zavriPanel();
    otevriModal();
  });

  hvezdicky.querySelectorAll('.hvezdicka').forEach(btn => {
    btn.addEventListener('click', () => {
      vybranéHodnoceni = parseInt(btn.dataset.val);
      hodnotaHodnoceni.textContent = vybranéHodnoceni;
      aktualizujHvezdicky(vybranéHodnoceni);
    });
    btn.addEventListener('mouseenter', () => aktualizujHvezdicky(parseInt(btn.dataset.val)));
    btn.addEventListener('mouseleave', () => aktualizujHvezdicky(vybranéHodnoceni));
  });

  document.getElementById('tlacitko-znovu').addEventListener('click', nactiHry);
  document.getElementById('logo-domu').addEventListener('click', (e) => {
    e.preventDefault();
    zobrazPohled('prohlizeni');
  });
})();

async function nactiHry(kategorie = '', platforma = '') {
  zobrazNacitani();
  try {
    let data;
    let params = new URLSearchParams();
    if (kategorie) params.set('category', kategorie);
    if (platforma) params.set('platform', platforma);
    const url = `${API_BASE}/games${params.toString() ? '?' + params.toString() : ''}`;
    try {
      const odpoved = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!odpoved.ok) throw new Error();
      data = await odpoved.json();
    } catch {
      const odpoved = await fetch(PROXY(url), { signal: AbortSignal.timeout(12000) });
      if (!odpoved.ok) throw new Error();
      data = await odpoved.json();
    }
    vsechnyHry = Array.isArray(data) ? data : [];
    if (!kategorie && !platforma) {
      try { localStorage.setItem('fgt_hry_cache', JSON.stringify(vsechnyHry)); } catch {}
    }
    aplikujRazeniAHledani();
    zobrazMrizku();
  } catch {
    const cache = localStorage.getItem('fgt_hry_cache');
    if (cache) {
      vsechnyHry = JSON.parse(cache);
      aplikujRazeniAHledani();
      zobrazMrizku();
      zobrazNotifikaci('Offline režim – zobrazena cache.');
    } else {
      zobrazChybu();
    }
  }
}

function aplikujFiltry() {
  nactiHry(filtrZanr.value, filtrPlatforma.value);
}

function aplikujRazeniAHledani() {
  const dotaz = dotazHledani.trim().toLowerCase();

  filtrovaneHry = vsechnyHry.filter(hra => {
    if (dotaz && !(
      hra.title.toLowerCase().includes(dotaz) ||
      (hra.short_description || '').toLowerCase().includes(dotaz) ||
      (hra.developer || '').toLowerCase().includes(dotaz)
    )) return false;
    return true;
  });

  switch (filtrRazeni.value) {
    case 'datum-vydani':
      filtrovaneHry.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
      break;
    case 'popularita':
      filtrovaneHry.sort((a, b) => a.id - b.id);
      break;
    case 'abecedne':
      filtrovaneHry.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  vykresliHry();
}

function priHledani() {
  dotazHledani = vstupHledani.value;
  aplikujRazeniAHledani();
}

function vykresliHry() {
  mrizkaHer.innerHTML = '';

  if (filtrovaneHry.length === 0) {
    mrizkaHer.hidden = true;
    zadneVysledky.hidden = false;
    return;
  }

  zadneVysledky.hidden = true;
  mrizkaHer.hidden = false;
  filtrovaneHry.forEach(hra => mrizkaHer.appendChild(vytvorKartu(hra)));
}

function vykresliOblibene() {
  mrizkaOblibenych.innerHTML = '';
  const ulozeneHry = vsechnyHry.filter(h => oblibene.includes(h.id));

  if (ulozeneHry.length === 0) {
    mrizkaOblibenych.hidden = true;
    zadneOblibene.hidden = false;
    return;
  }

  zadneOblibene.hidden = true;
  mrizkaOblibenych.hidden = false;
  ulozeneHry.forEach(hra => mrizkaOblibenych.appendChild(vytvorKartu(hra)));
}

function vytvorKartu(hra) {
  const jeUlozena = oblibene.includes(hra.id);

  const karta = document.createElement('article');
  karta.className = 'karta-hry';
  karta.setAttribute('role', 'button');
  karta.setAttribute('tabindex', '0');
  karta.setAttribute('aria-label', `Zobrazit detail hry ${hra.title}`);

  karta.innerHTML = `
    <div class="nahled-hry">
      <img src="${hra.thumbnail}" alt="${escapujHtml(hra.title)}" loading="lazy" />
      <span class="stitek-platformy">${escapujHtml(hra.platform || 'PC')}</span>
      <button class="tlacitko-oblibene ${jeUlozena ? 'ulozeno' : ''}"
              data-id="${hra.id}"
              aria-label="${jeUlozena ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}"
              title="${aktualniUzivatel ? '' : 'Přihlas se pro ukládání her'}">
        ${jeUlozena ? '♥' : (aktualniUzivatel ? '♡' : '🔒')}
      </button>
    </div>
    <div class="info-karty">
      <div class="zanr-hry">${escapujHtml(hra.genre || '')}</div>
      <div class="nazev-hry">${escapujHtml(hra.title)}</div>
      <div class="vyvojar-hry">${escapujHtml(hra.developer || '')}</div>
    </div>
  `;

  karta.addEventListener('click', (e) => {
    if (e.target.closest('.tlacitko-oblibene')) return;
    otevriDetail(hra);
  });
  karta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.target.closest('.tlacitko-oblibene')) otevriDetail(hra);
  });

  karta.querySelector('.tlacitko-oblibene').addEventListener('click', (e) => {
    e.stopPropagation();
    prepniOblibene(hra.id);
  });

  return karta;
}

async function nactiDetailHry(id) {
  try {
    let data;
    const url = `https://www.freetogame.com/api/game?id=${id}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error();
      data = await r.json();
    } catch {
      const r = await fetch(PROXY(url), { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error();
      data = await r.json();
    }
    return data;
  } catch {
    return null;
  }
}

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

async function otevriDetail(hra) {
  aktualniHra = hra;
  vybranéHodnoceni = 0;

  detailObrazek.innerHTML = `<img src="${hra.screenshot || hra.thumbnail}" alt="${escapujHtml(hra.title)}" loading="lazy" />`;

  detailTelo.innerHTML = `
    <h2 class="detail-nazev">${escapujHtml(hra.title)}</h2>
    <div class="detail-meta">
      <span class="meta-stitek akcent">${escapujHtml(hra.genre || '')}</span>
      <span class="meta-stitek">${escapujHtml(hra.platform || 'PC')}</span>
      ${hra.release_date ? `<span class="meta-stitek">${escapujHtml(hra.release_date)}</span>` : ''}
      ${hra.developer ? `<span class="meta-stitek">${escapujHtml(hra.developer)}</span>` : ''}
    </div>
    <div id="misto-hodnoceni"></div>
    <p class="detail-popis">${escapujHtml(hra.short_description || '')}</p>
    <div id="detail-extra"><p class="detail-nacitani">Načítám detaily…</p></div>
    <div class="detail-odkazy">
      ${hra.game_url ? `<a href="${hra.game_url}" target="_blank" rel="noopener" class="tlacitko-hlavni">Hrát zdarma →</a>` : ''}
      <button class="tlacitko-vedlejsi" id="tlacitko-oblibene-detail"
              title="${aktualniUzivatel ? '' : 'Přihlas se pro ukládání her'}">
        ${oblibene.includes(hra.id) ? '♥ Uloženo' : (aktualniUzivatel ? '♡ Uložit' : '🔒 Přihlásit se')}
      </button>
    </div>
  `;

  document.getElementById('tlacitko-oblibene-detail').addEventListener('click', () => {
    prepniOblibene(hra.id);
  });

  panelDetailu.hidden = false;
  prekrytiPanelu.hidden = false;
  document.body.style.overflow = 'hidden';

  if (aktualniUzivatel) {
    sekceKomentaru.hidden = false;
    vyzva.hidden = true;
    textKomentare.value = '';
    hodnotaHodnoceni.textContent = '–';
    aktualizujHvezdicky(0);
  } else {
    sekceKomentaru.hidden = true;
    vyzva.hidden = false;
  }

  const [detail] = await Promise.all([
    nactiDetailHry(hra.id),
    nactiAZobrazKomentare(hra.id)
  ]);

  const extra = document.getElementById('detail-extra');
  if (!extra) return;

  if (!detail) {
    extra.innerHTML = '';
    return;
  }

  const vidId = youtubeId(detail.freetogame_profile_url) || youtubeId(detail.game_url);
  const videoHtml = vidId
    ? `<div class="detail-video">
        <iframe id="gameplay-iframe" src="https://www.youtube.com/embed/${vidId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                title="Gameplay video"></iframe>
        <button class="video-fullscreen-btn" data-vid="${vidId}" title="Celá obrazovka">⛶</button>
       </div>`
    : '';

  const screenshoty = (detail.screenshots || []).slice(0, 4);
  const screenshotHtml = screenshoty.length > 0
    ? `<div class="detail-screenshoty">
        ${screenshoty.map((s, i) => `<img src="${s.image}" alt="screenshot" loading="lazy" data-index="${i}" class="screenshot-klik" />`).join('')}
       </div>`
    : '';

  const pozadavky = detail.minimum_system_requirements;
  const pozadavkyHtml = pozadavky && Object.values(pozadavky).some(v => v)
    ? `<div class="detail-pozadavky">
        <div class="pozadavky-nadpis">MINIMÁLNÍ POŽADAVKY</div>
        <table class="pozadavky-tabulka">
          ${pozadavky.os ? `<tr><td>OS</td><td>${escapujHtml(pozadavky.os)}</td></tr>` : ''}
          ${pozadavky.processor ? `<tr><td>CPU</td><td>${escapujHtml(pozadavky.processor)}</td></tr>` : ''}
          ${pozadavky.memory ? `<tr><td>RAM</td><td>${escapujHtml(pozadavky.memory)}</td></tr>` : ''}
          ${pozadavky.graphics ? `<tr><td>GPU</td><td>${escapujHtml(pozadavky.graphics)}</td></tr>` : ''}
          ${pozadavky.storage ? `<tr><td>HDD</td><td>${escapujHtml(pozadavky.storage)}</td></tr>` : ''}
        </table>
       </div>`
    : '';

  const popisHtml = detail.description && detail.description !== hra.short_description
    ? `<p class="detail-popis detail-popis-plny">${escapujHtml(detail.description)}</p>`
    : '';

  extra.innerHTML = `
    ${popisHtml}
    ${videoHtml}
    ${screenshotHtml}
    ${pozadavkyHtml}
  `;

  const vsechnyScreenshoty = (detail.screenshots || []).slice(0, 4).map(s => s.image);

  extra.querySelectorAll('.screenshot-klik').forEach(img => {
    img.addEventListener('click', () => {
      otevriLightbox(vsechnyScreenshoty, parseInt(img.dataset.index));
    });
  });

  const vidBtn = extra.querySelector('.video-fullscreen-btn');
  if (vidBtn) {
    vidBtn.addEventListener('click', () => {
      const iframe = document.getElementById('gameplay-iframe');
      if (iframe && iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe && iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      }
    });
  }
}

function otevriLightbox(obrazky, startIndex) {
  let aktualniIndex = startIndex;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';

  overlay.innerHTML = `
    <button class="lightbox-zavrit">✕</button>
    <button class="lightbox-prev">‹</button>
    <div class="lightbox-obsah">
      <img class="lightbox-img" src="${obrazky[aktualniIndex]}" alt="screenshot" />
      <div class="lightbox-pocitadlo">${aktualniIndex + 1} / ${obrazky.length}</div>
    </div>
    <button class="lightbox-next">›</button>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const img = overlay.querySelector('.lightbox-img');
  const pocitadlo = overlay.querySelector('.lightbox-pocitadlo');

  function zobrazObrazek(index) {
    aktualniIndex = (index + obrazky.length) % obrazky.length;
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = obrazky[aktualniIndex];
      pocitadlo.textContent = `${aktualniIndex + 1} / ${obrazky.length}`;
      img.style.opacity = '1';
    }, 120);
  }

  overlay.querySelector('.lightbox-zavrit').addEventListener('click', zavriLightbox);
  overlay.querySelector('.lightbox-prev').addEventListener('click', () => zobrazObrazek(aktualniIndex - 1));
  overlay.querySelector('.lightbox-next').addEventListener('click', () => zobrazObrazek(aktualniIndex + 1));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) zavriLightbox();
  });

  document.addEventListener('keydown', klavesaLightbox);

  function klavesaLightbox(e) {
    if (e.key === 'ArrowRight') zobrazObrazek(aktualniIndex + 1);
    if (e.key === 'ArrowLeft') zobrazObrazek(aktualniIndex - 1);
    if (e.key === 'Escape') zavriLightbox();
  }

  function zavriLightbox() {
    overlay.remove();
    document.body.style.overflow = 'hidden';
    document.removeEventListener('keydown', klavesaLightbox);
  }
}

function zavriPanel() {
  panelDetailu.hidden = true;
  prekrytiPanelu.hidden = true;
  document.body.style.overflow = '';
  aktualniHra = null;
}

async function nactiAZobrazKomentare(idHry) {
  seznamKomentaru.innerHTML = '<p style="font-size:0.8rem;color:var(--text-dim)">Načítám komentáře…</p>';

  try {
    const q = query(collection(db, 'hry', String(idHry), 'komentare'), orderBy('datum', 'desc'));
    const snapshot = await getDocs(q);
    const komentar = [];
    snapshot.forEach(d => komentar.push(d.data()));

    const hodnoceni = komentar.filter(k => k.hodnoceni);
    const prumer = hodnoceni.length
      ? hodnoceni.reduce((s, k) => s + k.hodnoceni, 0) / hodnoceni.length
      : null;

    const mistoHodnoceni = document.getElementById('misto-hodnoceni');
    if (mistoHodnoceni && prumer) {
      mistoHodnoceni.innerHTML = `
        <div class="prumerne-hodnoceni">
          <span class="skore-hodnoceni">${prumer.toFixed(1)}</span>
          <span class="popis-hodnoceni">/ 10 průměr<br/><small>(${komentar.length} hodnocení)</small></span>
        </div>`;
    }

    seznamKomentaru.innerHTML = '';
    if (komentar.length === 0) {
      seznamKomentaru.innerHTML = '<p style="font-size:0.8rem;color:var(--text-dim)">Zatím žádné komentáře. Buď první!</p>';
      return;
    }

    komentar.forEach(k => {
      const polozka = document.createElement('div');
      polozka.className = 'polozka-komentare';
      polozka.innerHTML = `
        <div class="hlavicka-komentare">
          <span class="uzivatel-komentare">${escapujHtml(k.uzivatel)}</span>
          ${k.hodnoceni ? `<span class="stitek-hodnoceni-komentare">★ ${k.hodnoceni}/10</span>` : ''}
          <span class="datum-komentare">${formatujDatum(k.datum)}</span>
        </div>
        <div class="text-komentare">${escapujHtml(k.text)}</div>
      `;
      seznamKomentaru.appendChild(polozka);
    });
  } catch {
    seznamKomentaru.innerHTML = '<p style="font-size:0.8rem;color:var(--text-dim)">Komentáře se nepodařilo načíst.</p>';
  }
}

async function pridejKomentar() {
  if (!aktualniUzivatel || !aktualniHra) return;

  const text = textKomentare.value.trim();
  if (!text) {
    zobrazNotifikaci('Napiš komentář.');
    return;
  }

  const novyKomentar = {
    uzivatel: aktualniUzivatel.displayName || aktualniUzivatel.email.split('@')[0],
    text,
    hodnoceni: vybranéHodnoceni || null,
    datum: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, 'hry', String(aktualniHra.id), 'komentare'), novyKomentar);

    textKomentare.value = '';
    vybranéHodnoceni = 0;
    hodnotaHodnoceni.textContent = '–';
    aktualizujHvezdicky(0);

    await nactiAZobrazKomentare(aktualniHra.id);
    zobrazNotifikaci('Komentář přidán ✓');
  } catch {
    zobrazNotifikaci('Nepodařilo se přidat komentář.');
  }
}

function aktualizujHvezdicky(hodnota) {
  hvezdicky.querySelectorAll('.hvezdicka').forEach(btn => {
    btn.classList.toggle('aktivni', parseInt(btn.dataset.val) <= hodnota);
  });
}

async function nactiOblibeneZFirestore() {
  if (!aktualniUzivatel) return [];
  try {
    const snap = await getDocs(collection(db, 'uzivatele', aktualniUzivatel.uid, 'oblibene'));
    return snap.docs.map(d => parseInt(d.id));
  } catch {
    return [];
  }
}

async function prepniOblibene(idHry) {
  if (!aktualniUzivatel) {
    otevriModal();
    return;
  }

  const ref = doc(db, 'uzivatele', aktualniUzivatel.uid, 'oblibene', String(idHry));
  const jeUlozena = oblibene.includes(idHry);

  try {
    if (jeUlozena) {
      await deleteDoc(ref);
      oblibene = oblibene.filter(id => id !== idHry);
      zobrazNotifikaci('Odebráno z oblíbených');
    } else {
      await setDoc(ref, { idHry });
      oblibene.push(idHry);
      zobrazNotifikaci('Hra uložena ♥');
    }

    aktualizujPocetOblibenych();

    document.querySelectorAll(`.tlacitko-oblibene[data-id="${idHry}"]`).forEach(btn => {
      btn.classList.toggle('ulozeno', oblibene.includes(idHry));
      btn.textContent = oblibene.includes(idHry) ? '♥' : '♡';
    });

    const btnDetail = document.getElementById('tlacitko-oblibene-detail');
    if (btnDetail && aktualniHra && aktualniHra.id === idHry) {
      btnDetail.textContent = oblibene.includes(idHry) ? '♥ Uloženo' : '♡ Uložit';
    }

    if (!pohledOblibene.hidden) vykresliOblibene();
  } catch {
    zobrazNotifikaci('Něco se pokazilo.');
  }
}

function aktualizujPocetOblibenych() {
  pocetOblibenych.textContent = oblibene.length;
  pocetOblibenych.classList.toggle('viditelny', oblibene.length > 0);
}

function klikAuthTlacitko() {
  if (aktualniUzivatel) {
    signOut(auth);
    zobrazNotifikaci('Odhlášen.');
    if (!pohledOblibene.hidden) zobrazPohled('prohlizeni');
    if (!panelDetailu.hidden) {
      sekceKomentaru.hidden = true;
      vyzva.hidden = false;
    }
  } else {
    otevriModal();
  }
}

async function odeslatFormular() {
  const email = vstupEmail.value.trim();
  const heslo = vstupHeslo.value;
  const jmeno = vstupJmeno.value.trim();

  if (rezimRegistrace && !jmeno) {
    zobrazChybuModalu('Zadej uživatelské jméno.');
    return;
  }
  if (rezimRegistrace && jmeno.length < 2) {
    zobrazChybuModalu('Jméno musí mít alespoň 2 znaky.');
    return;
  }
  if (!email || !heslo) {
    zobrazChybuModalu('Vyplň e-mail a heslo.');
    return;
  }

  odeslatPrihlaseni.disabled = true;
  odeslatPrihlaseni.textContent = rezimRegistrace ? 'Registruji…' : 'Přihlašuji…';

  try {
    if (rezimRegistrace) {
      const vysledek = await createUserWithEmailAndPassword(auth, email, heslo);
      await updateProfile(vysledek.user, { displayName: jmeno });
      zobrazNotifikaci('Účet vytvořen! 👾');
    } else {
      await signInWithEmailAndPassword(auth, email, heslo);
      zobrazNotifikaci(`Vítej zpět! 👾`);
    }
    zavriModal();
  } catch (chyba) {
    const zpravy = {
      'auth/email-already-in-use': 'Tento e-mail je již použit.',
      'auth/invalid-email': 'Neplatný e-mail.',
      'auth/weak-password': 'Heslo musí mít alespoň 6 znaků.',
      'auth/invalid-credential': 'Špatný e-mail nebo heslo.',
      'auth/user-not-found': 'Účet neexistuje.',
      'auth/wrong-password': 'Špatné heslo.',
    };
    zobrazChybuModalu(zpravy[chyba.code] || 'Něco se pokazilo.');
  } finally {
    odeslatPrihlaseni.disabled = false;
    odeslatPrihlaseni.textContent = rezimRegistrace ? 'Zaregistrovat se' : 'Přihlásit se';
  }
}

function prepniRezimModalu() {
  rezimRegistrace = !rezimRegistrace;
  vstupJmeno.style.display = rezimRegistrace ? 'block' : 'none';
  if (rezimRegistrace) {
    nadpisModalu.textContent = 'REGISTRACE';
    podnadpisModalu.textContent = 'Vytvoř si nový účet';
    odeslatPrihlaseni.textContent = 'ZAREGISTROVAT SE';
    prepnoutRegistraci.textContent = 'Přihlásit se';
    prepnoutRegistraci.previousSibling.textContent = 'Už máš účet? ';
    setTimeout(() => vstupJmeno.focus(), 50);
  } else {
    nadpisModalu.textContent = 'PŘIHLÁŠENÍ';
    podnadpisModalu.textContent = 'Přihlas se svým účtem';
    odeslatPrihlaseni.textContent = 'PŘIHLÁSIT SE';
    prepnoutRegistraci.textContent = 'Zaregistruj se';
    prepnoutRegistraci.previousSibling.textContent = 'Nemáš účet? ';
  }
  chybaModalu.hidden = true;
}

function otevriModal() {
  rezimRegistrace = false;
  nadpisModalu.textContent = 'Přihlášení';
  podnadpisModalu.textContent = 'Přihlas se svým účtem';
  odeslatPrihlaseni.textContent = 'Přihlásit se';
  prepnoutRegistraci.textContent = 'Zaregistruj se';
  modalPrihlaseni.classList.add('otevreno');
  vstupJmeno.value = '';
  vstupJmeno.style.display = 'none';
  vstupEmail.value = '';
  vstupHeslo.value = '';
  chybaModalu.hidden = true;
  setTimeout(() => vstupEmail.focus(), 50);
}

function zavriModal() {
  modalPrihlaseni.classList.remove('otevreno');
}

function zobrazChybuModalu(zprava) {
  chybaModalu.textContent = zprava;
  chybaModalu.hidden = false;
}

function aktualizujAuthUI() {
  if (aktualniUzivatel) {
    tlacitkoAuth.textContent = `Odhlásit (${aktualniUzivatel.displayName || aktualniUzivatel.email.split('@')[0]})`;
    tlacitkoAuth.classList.add('prihlasen');
  } else {
    tlacitkoAuth.textContent = 'Přihlásit se';
    tlacitkoAuth.classList.remove('prihlasen');
  }
}

function zobrazPohled(pohled) {
  if (pohled === 'oblibene' && !aktualniUzivatel) {
    otevriModal();
    return;
  }
  const jeProhlizeni = pohled === 'prohlizeni';
  pohledProhlizeni.hidden = !jeProhlizeni;
  pohledOblibene.hidden = jeProhlizeni;
  navProhlizeni.classList.toggle('aktivni', jeProhlizeni);
  navOblibene.classList.toggle('aktivni', !jeProhlizeni);
  if (!jeProhlizeni) vykresliOblibene();
}

function prepniHledani() {
  const byloSkryto = panelHledani.hidden;
  panelHledani.hidden = !byloSkryto;
  if (!byloSkryto) {
    dotazHledani = '';
    vstupHledani.value = '';
    aplikujFiltry();
  } else {
    vstupHledani.focus();
  }
}

function zobrazNacitani() {
  stavNacitani.hidden = false;
  stavChyby.hidden = true;
  mrizkaHer.hidden = true;
  zadneVysledky.hidden = true;
}

function zobrazMrizku() {
  stavNacitani.hidden = true;
  stavChyby.hidden = true;
}

function zobrazChybu() {
  stavNacitani.hidden = true;
  stavChyby.hidden = false;
  mrizkaHer.hidden = true;
}

let casovacNotifikace;
function zobrazNotifikaci(zprava) {
  notifikace.textContent = zprava;
  notifikace.hidden = false;
  clearTimeout(casovacNotifikace);
  void notifikace.offsetWidth;
  notifikace.classList.add('zobrazena');
  casovacNotifikace = setTimeout(() => {
    notifikace.classList.remove('zobrazena');
    setTimeout(() => { notifikace.hidden = true; }, 300);
  }, 2500);
}

function escapujHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatujDatum(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}


const PLAYLIST = [
  { nazev: 'Hazardous Environments', vid: 'O4jY9Q7HGuo' },
  { nazev: 'Klaxon Beat',            vid: 'iuFqwa5hVzY' },
  { nazev: 'Credits Closing Theme',  vid: '9_UBS7_9kw4' },
];

let ytPrehravac = null;
let aktualniStopa = 0;
let hrajeSe = false;
let progressInterval = null;

const btnPlay     = document.getElementById('btn-play');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');
const prehravacNazev  = document.getElementById('prehravac-nazev');
const progressBar = document.getElementById('progress-bar');
const prehravacCas = document.getElementById('prehravac-cas');
const progressEl  = document.getElementById('prehravac-progress');
const ytKontejner = document.getElementById('yt-kontejner');

window.onYouTubeIframeAPIReady = function() {
  const iframe = document.createElement('div');
  iframe.id = 'yt-iframe';
  ytKontejner.appendChild(iframe);

  ytPrehravac = new YT.Player('yt-iframe', {
    height: '1',
    width: '1',
    videoId: PLAYLIST[aktualniStopa].vid,
    playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
    events: {
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          preskocStopa(1);
        }
        if (e.data === YT.PlayerState.PLAYING) {
          hrajeSe = true;
          btnPlay.textContent = '⏸';
          spustProgress();
        }
        if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.BUFFERING) {
          if (e.data === YT.PlayerState.PAUSED) {
            hrajeSe = false;
            btnPlay.textContent = '▶';
          }
          zastavProgress();
        }
      }
    }
  });
};

const ytScript = document.createElement('script');
ytScript.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(ytScript);

function spustProgress() {
  zastavProgress();
  progressInterval = setInterval(() => {
    if (!ytPrehravac) return;
    const delka = ytPrehravac.getDuration();
    const cas = ytPrehravac.getCurrentTime();
    if (delka > 0) {
      progressBar.style.width = (cas / delka * 100) + '%';
      prehravacCas.textContent = formatujCas(cas);
    }
  }, 500);
}

function zastavProgress() {
  clearInterval(progressInterval);
}

function formatujCas(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function nactiStopa(index, autoplay = false) {
  aktualniStopa = (index + PLAYLIST.length) % PLAYLIST.length;
  const stopa = PLAYLIST[aktualniStopa];
  prehravacNazev.textContent = stopa.nazev;
  progressBar.style.width = '0%';
  prehravacCas.textContent = '0:00';
  if (ytPrehravac) {
    ytPrehravac.loadVideoById(stopa.vid);
    if (!autoplay) ytPrehravac.pauseVideo();
  }
}

function preskocStopa(smer) {
  nactiStopa(aktualniStopa + smer, true);
}

btnPlay.addEventListener('click', () => {
  if (!ytPrehravac) return;
  if (hrajeSe) {
    ytPrehravac.pauseVideo();
  } else {
    ytPrehravac.playVideo();
  }
});

btnNext.addEventListener('click', () => preskocStopa(1));
btnPrev.addEventListener('click', () => preskocStopa(-1));

progressEl.addEventListener('click', (e) => {
  if (!ytPrehravac) return;
  const rect = progressEl.getBoundingClientRect();
  const pomer = (e.clientX - rect.left) / rect.width;
  ytPrehravac.seekTo(ytPrehravac.getDuration() * pomer, true);
});