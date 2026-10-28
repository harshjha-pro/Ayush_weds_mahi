import { config } from './config.js';
import { themes, fontsReady, drawCard } from './card.js';

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

let toastTimer;
function toast(message) {
  const box = $('#toast');
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, 3200);
}

const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

const whatsappLink = (text) =>
  config.contact.whatsapp ? `https://wa.me/${config.contact.whatsapp}?text=${encodeURIComponent(text)}` : null;

/* ---------- Brand text ---------- */

function renderBrand() {
  const { brand } = config;
  document.querySelectorAll('[data-brand-short]').forEach((n) => { n.textContent = brand.short; });
  document.querySelectorAll('[data-brand-name]').forEach((n) => { n.textContent = brand.name; });
  document.querySelectorAll('[data-tagline]').forEach((n) => { n.textContent = brand.tagline; });
  document.querySelectorAll('[data-tagline-hi]').forEach((n) => { n.textContent = brand.taglineHindi; });
  $('#year').textContent = new Date().getFullYear();
}

/* ---------- Services ---------- */

const icons = {
  scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M9 9h7M9 13h7M9 17h4"/>',
  film: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.5 2 2 3.5 2s2.5-.5 3.5-2M9 10h.01M15 10h.01"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};

function renderServices() {
  const list = $('#services-list');
  for (const s of config.services) {
    const icon = el('div', { class: 'service-icon' });
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[s.icon] || icons.scroll}</svg>`;
    list.append(el('article', { class: 'service reveal' }, [
      icon, el('h3', { text: s.title }), el('p', { text: s.text }),
    ]));
  }
}

/* ---------- Ceremonies, steps, packages, FAQ ---------- */

function renderCeremonies() {
  const list = $('#ceremony-list');
  for (const c of config.ceremonies) {
    list.append(el('li', { class: 'ceremony reveal' }, [
      el('h3', { text: c.name }),
      el('p', { class: 'hindi', lang: 'hi', text: c.hindi }),
      el('p', { text: c.text }),
    ]));
  }
}

function renderSteps() {
  const list = $('#steps-list');
  for (const s of config.steps) {
    list.append(el('li', { class: 'step reveal' }, [el('h3', { text: s.title }), el('p', { text: s.text })]));
  }
}

function renderPackages() {
  const list = $('#packages-list');
  for (const p of config.packages) {
    const ask = `Hello! I'd like to know more about the ${p.name} package.`;
    const link = whatsappLink(ask);
    list.append(el('article', { class: `package reveal${p.featured ? ' featured' : ''}` }, [
      p.featured ? el('span', { class: 'badge', text: 'Most loved' }) : null,
      el('h3', { text: p.name }),
      el('p', { class: 'price', text: p.price || 'Price on request' }),
      el('ul', {}, p.features.map((f) => el('li', { text: f }))),
      el('a', {
        class: 'btn btn-ghost',
        href: link || '#enquire',
        target: link ? '_blank' : null,
        rel: link ? 'noopener' : null,
        'data-package': p.name,
        text: 'Ask about this',
      }),
    ]));
  }
  // Without WhatsApp, pre-fill the enquiry form with the chosen package.
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-package]');
    if (!btn || config.contact.whatsapp) return;
    const msg = $('#enquiry-form [name="message"]');
    msg.value = `Interested in the ${btn.dataset.package} package. ${msg.value}`.trim();
  });
}

function renderFaqs() {
  const list = $('#faq-list');
  for (const f of config.faqs) {
    list.append(el('details', { class: 'reveal' }, [el('summary', { text: f.q }), el('p', { text: f.a })]));
  }
}

/* ---------- Invite maker ---------- */

const mainCeremony = { name: 'Shubh Vivah', hindi: 'शुभ विवाह' };
const ceremonyOptions = [mainCeremony, ...config.ceremonies];

function formatDate(date, time) {
  if (!date) return 'Date to be announced';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'Date to be announced';
  let line = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (time) {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    line += ` · ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
  }
  return line;
}

function cardData(values) {
  const c = ceremonyOptions[Number(values.ceremony) || 0] || mainCeremony;
  return {
    bride: values.bride?.trim() || 'Mahi',
    groom: values.groom?.trim() || 'Ayush',
    ceremony: c.name,
    ceremonyHindi: c.hindi,
    dateLine: formatDate(values.date, values.time),
    venue: values.venue?.trim() || 'Venue, City',
    family: values.family?.trim() ? `With love, ${values.family.trim()}` : '',
  };
}

function setupMaker() {
  const form = $('#maker-form');
  const canvas = $('#maker-canvas');
  const select = $('#maker-ceremony');
  const note = $('#maker-note');

  ceremonyOptions.forEach((c, i) => select.append(el('option', { value: i, text: `${c.name} · ${c.hindi}` })));

  const themeList = $('#theme-list');
  themes.forEach((t, i) => {
    const dot = el('span', { class: 'dot' });
    dot.style.background = `radial-gradient(circle at 50% 50%, ${t.inner[0]} 0 38%, ${t.outer} 40%)`;
    themeList.append(el('label', { class: 'theme-swatch' }, [
      el('input', { type: 'radio', name: 'theme', value: t.id, checked: i === 0 ? '' : null }),
      dot,
      document.createTextNode(t.label),
    ]));
  });

  const saved = store.get('bfi-maker');
  if (saved) {
    for (const [key, value] of Object.entries(saved)) {
      const field = form.elements[key];
      if (!field || value == null) continue;
      if (field instanceof RadioNodeList) {
        const radio = [...field].find((r) => r.value === value);
        if (radio) radio.checked = true;
      } else {
        field.value = value;
      }
    }
  }

  const values = () => Object.fromEntries(new FormData(form));
  const theme = () => themes.find((t) => t.id === values().theme) || themes[0];
  const draw = () => drawCard(canvas, cardData(values()), theme());

  let raf;
  form.addEventListener('input', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
    store.set('bfi-maker', values());
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  const fileName = () => {
    const d = cardData(values());
    const slug = `${d.bride}-${d.groom}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `bfi-invite-${slug || 'sample'}.png`;
  };
  const toBlob = () => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

  async function download() {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: fileName() });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    note.textContent = 'Card downloaded. Send it to us and we will design the full set.';
  }

  $('#maker-download').addEventListener('click', download);

  $('#maker-share').addEventListener('click', async () => {
    const d = cardData(values());
    const text = `Sample ${d.ceremony} invite for ${d.bride} & ${d.groom}, made with ${config.brand.name}.`;
    const blob = await toBlob();
    const file = blob && new File([blob], fileName(), { type: 'image/png' });
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${config.brand.name} invite`, text });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    const link = whatsappLink(`${text} I'd like to get the full set designed.`);
    if (link) {
      window.open(link, '_blank', 'noopener');
      note.textContent = 'Attach the downloaded card in WhatsApp to show us your sample.';
      download();
    } else {
      download();
    }
  });

  return draw;
}

/* ---------- Hero card and gallery ---------- */

const samples = [
  { bride: 'Mahi', groom: 'Ayush', ceremony: 0, date: '2026-11-15', time: '19:00', venue: 'Chittorgarh, Rajasthan', family: 'The Jagetiya family' },
  { bride: 'Riya', groom: 'Kunal', ceremony: 5, date: '2026-12-02', time: '16:00', venue: 'Jodhpur', family: 'The Maheshwari family' },
  { bride: 'Ananya', groom: 'Harsh', ceremony: 4, date: '2027-01-21', time: '11:00', venue: 'Bikaner', family: 'The Agarwal family' },
  { bride: 'Kavya', groom: 'Arjun', ceremony: 8, date: '2027-02-10', time: '20:30', venue: 'Udaipur', family: 'The Oswal family' },
];

function renderGallery() {
  const list = $('#gallery-list');
  const lede = $('#gallery-lede');
  if (config.portfolio.length) {
    lede.textContent = 'A few invitations we have made for families.';
    for (const item of config.portfolio) {
      list.append(el('figure', { class: 'reveal' }, [
        el('img', { src: item.src, alt: item.caption || 'Invitation design', loading: 'lazy' }),
        item.caption ? el('figcaption', { text: item.caption }) : null,
      ]));
    }
    return () => {};
  }

  lede.textContent = 'Sample designs in our four signature themes, made with the invite maker above.';
  const canvases = themes.map((t, i) => {
    const canvas = el('canvas', { width: 540, height: 675, role: 'img', 'aria-label': `${t.label} theme sample card` });
    list.append(el('figure', { class: 'reveal' }, [canvas, el('figcaption', { text: `${t.label} theme` })]));
    return () => drawCard(canvas, cardData(samples[i % samples.length]), t);
  });
  return () => canvases.forEach((draw) => draw());
}

function drawHero() {
  drawCard($('#hero-card'), cardData(samples[0]), themes[1]);
}

/* ---------- Enquiry ---------- */

function setupEnquiry() {
  const form = $('#enquiry-form');
  const note = $('#enquiry-note');
  const services = $('#enquiry-services');
  for (const s of config.services) {
    services.append(el('label', { class: 'check' }, [
      el('input', { type: 'checkbox', name: 'services', value: s.title }),
      document.createTextNode(s.title),
    ]));
  }

  const { whatsapp, email } = config.contact;
  if (!whatsapp && email) $('#enquiry-submit').textContent = 'Send enquiry by email';
  if (whatsapp) $('#enquiry-submit').textContent = 'Send on WhatsApp';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const picked = data.getAll('services');
    const lines = [
      `Hello ${config.brand.name}! I'd like to enquire about wedding invitations.`,
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone')}`,
      data.get('date') && `Wedding date: ${formatDate(data.get('date'))}`,
      data.get('city') && `City: ${data.get('city')}`,
      picked.length && `Interested in: ${picked.join(', ')}`,
      data.get('message') && `Notes: ${data.get('message')}`,
    ].filter(Boolean);
    const text = lines.join('\n');

    if (whatsapp) {
      window.open(whatsappLink(text), '_blank', 'noopener');
      note.textContent = 'WhatsApp opened with your details. Just press send.';
    } else if (email) {
      location.href = `mailto:${email}?subject=${encodeURIComponent('Wedding invitation enquiry')}&body=${encodeURIComponent(text)}`;
    } else {
      try {
        await navigator.clipboard.writeText(text);
        note.textContent = 'Your enquiry is copied. Paste it into a message to us.';
      } catch {
        note.textContent = 'Please send these details to us directly.';
      }
    }
  });
}

function renderContact() {
  const { contact, brand } = config;
  const list = $('#contact-list');
  const item = (label, text, href) =>
    el('li', {}, [el('span', { text: label }), href ? el('a', { href, text, target: href.startsWith('http') ? '_blank' : null, rel: 'noopener' }) : document.createTextNode(text)]);

  if (contact.phone) list.append(item('Call', contact.phone, `tel:${contact.phone.replace(/\s+/g, '')}`));
  if (contact.whatsapp) list.append(item('WhatsApp', `+${contact.whatsapp}`, whatsappLink('Hello!')));
  if (contact.email) list.append(item('Email', contact.email, `mailto:${contact.email}`));
  if (contact.instagram) list.append(item('Instagram', `@${contact.instagram}`, `https://instagram.com/${contact.instagram}`));
  if (contact.address || brand.city) list.append(item('Studio', contact.address || brand.city));
  if (contact.hours) list.append(item('Hours', contact.hours));

  if (contact.whatsapp) {
    const fab = $('#wa-fab');
    fab.href = whatsappLink(`Hello ${brand.name}! I'd like to know about wedding invitations.`);
    fab.hidden = false;
  }
}

/* ---------- App shell: install, offline, tab bar, reveal ---------- */

function setupInstall() {
  const btn = $('#install-btn');
  let deferred;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => {
    btn.hidden = true;
    toast(`${config.brand.short} is installed on your home screen.`);
  });

  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !standalone && !store.get('bfi-ios-hint')) {
    setTimeout(() => toast('Tip: tap Share, then “Add to Home Screen” to install this app.'), 4000);
    store.set('bfi-ios-hint', true);
  }
}

function setupServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
  window.addEventListener('offline', () => toast('You are offline. Saved pages still work.'));
}

function setupTabbar() {
  const links = [...document.querySelectorAll('.tabbar a')];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href') === '#top' ? '.hero' : a.getAttribute('href')));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const i = targets.indexOf(entry.target);
      links.forEach((a, j) => a.classList.toggle('active', i === j));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach((t) => t && observer.observe(t));
}

function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((n) => n.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((n) => observer.observe(n));
}

/* ---------- Start ---------- */

renderBrand();
renderServices();
renderCeremonies();
renderSteps();
renderPackages();
renderFaqs();
renderContact();
setupEnquiry();
const drawMaker = setupMaker();
const drawGallery = renderGallery();
const drawAll = () => { drawHero(); drawMaker(); drawGallery(); };
drawAll();
fontsReady.then(drawAll);
setupReveal();
setupTabbar();
setupInstall();
setupServiceWorker();
