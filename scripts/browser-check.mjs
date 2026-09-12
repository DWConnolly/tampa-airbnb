/* global document, window, location, getComputedStyle, innerWidth, innerHeight,
   scrollTo, Image, DOMParser, matchMedia, __check, axe */
/**
 * Dependency-free Chrome/CDP regression checks. Run: node scripts/browser-check.mjs
 * Requires Node with native fetch/WebSocket and an installed Chrome.
 * Options: --url=http://127.0.0.1:4183/tampa-airbnb/ --no-axe --no-screenshots
 * CHROME_PATH overrides the macOS Chrome default. Never writes application files.
 * Starts preview only if absent; owns/cleans its Chrome/profile and owned preview.
 * Artifacts/report are retained in an OS temporary directory, printed at completion.
 * Reflow approximation halves CSS viewport dimensions, NOT browser UI zoom.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const url = new URL(args.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:4183/tampa-airbnb/');
const expectedAirbnb = 'https://www.airbnb.com/rooms/1211112487690698739';
const output = await mkdtemp(join(tmpdir(), 'blue-bliss-browser-'));
const profile = await mkdtemp(join(tmpdir(), 'blue-bliss-chrome-'));
const report = { url: url.href, started: new Date().toISOString(), output, tests: [], metrics: {}, screenshots: [], limitations: [
  'Headless Chromium only; no Safari, physical touch device, screen reader, or visual screenshot review.',
  '200% reflow approximated by halving CSS viewport width/height, not actual browser UI zoom.',
  'Room descriptions/captions need owner review; browser checks do not visually identify photo contents.',
  'Pixel similarity is diagnostic only; an owner must confirm JPEG identity, crop, and publishing rights.',
] };
let chrome, preview, cdp, cleaning, endpoint, pageId;
const logs = { chrome: '', preview: '' };
const runtimeErrors = [], networkErrors = [], responses = [];

function record(name, pass, details = {}) {
  report.tests.push({ name, status: pass ? 'PASS' : 'FAIL', details });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${pass ? '' : ` ${JSON.stringify(details)}`}`);
}
function skip(name, reason) {
  report.tests.push({ name, status: 'SKIP', details: { reason } });
  console.log(`SKIP ${name}: ${reason}`);
}
async function scenario(name, action) {
  try { await action(); } catch (error) { record(name, false, { error: error.stack }); }
}
async function waitFor(probe, timeout = 10000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { const value = await probe(); if (value) return value; } catch (error) { lastError = error; }
    await sleep(80);
  }
  throw new Error(`Timed out after ${timeout}ms${lastError ? `: ${lastError.message}` : ''}`);
}
function launch(binary, argv, name) {
  const child = spawn(binary, argv, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('error', error => { logs[name] += error.message; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { logs[name] = (logs[name] + data).slice(-20000); });
  return child;
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  try { await waitFor(() => child.exitCode !== null || child.signalCode !== null, 4000); }
  catch { child.kill('SIGKILL'); await waitFor(() => child.exitCode !== null || child.signalCode !== null, 4000); }
}
async function cleanup() {
  if (cleaning) return cleaning;
  cleaning = (async () => {
    cdp?.socket.close();
    await stop(chrome);
    await stop(preview);
    await rm(profile, { recursive: true, force: true, maxRetries: 3 });
  })();
  return cleaning;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  await cleanup(); process.exit(signal === 'SIGINT' ? 130 : 143);
});
const watchdog = setTimeout(async () => {
  console.error('Global browser-check timeout (5 minutes)');
  await cleanup(); process.exit(1);
}, 300000);

class CDP {
  constructor(socket) {
    this.socket = socket; this.nextId = 0; this.pending = new Map(); this.listeners = new Map();
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id); clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result);
      } else for (const listener of this.listeners.get(message.method) ?? []) listener(message.params);
    });
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('CDP closed')); }
      this.pending.clear();
    });
  }
  static async connect(address) {
    const socket = new WebSocket(address);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { socket.close(); reject(new Error('CDP connection timeout')); }, 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
    });
    return new CDP(socket);
  }
  on(method, listener) { this.listeners.set(method, [...this.listeners.get(method) ?? [], listener]); }
  send(method, params = {}, timeout = 20000) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(fn, ...args) {
    const expression = `(${fn.toString()})(${args.map(a => JSON.stringify(a)).join(',')})`;
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
}

// Browser helpers are installed on each document, without altering markup/styles.
function browserHelpers() {
  const visible = e => !!e && e.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true });
  const rect = e => {
    if (!visible(e)) return null;
    const { x, y, width, height, top, bottom, left, right } = e.getBoundingClientRect();
    return { x, y, width, height, top, bottom, left, right };
  };
  const unobscured = e => {
    const r = rect(e);
    if (!r || r.left < -1 || r.top < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return false;
    // Inset points are inside circular buttons too; bounding-box corners aren't
    // clickable pixels for a border-radius: 50% control.
    return [[.25, .25], [.5, .5], [.75, .75]].every(([x, y]) => e.contains(document.elementFromPoint(r.x + r.width * x, r.y + r.height * y)));
  };
  const overflow = () => ({
    viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    excess: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    offenders: [...document.querySelectorAll('body *')].filter(visible).filter(e => {
      const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
    }).slice(0, 12).map(e => ({ tag: e.tagName, id: e.id, class: e.getAttribute('class'), rect: rect(e) })),
  });
  window.__check = { visible, rect, unobscured, overflow };
}
async function navigate(width, height, scale = 1) {
  // Use a fresh renderer per scenario. Repeated cross-document navigation of a
  // deeply scrolled target can leave CDP promises in a destroyed context.
  const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
  cdp?.socket.close();
  if (pageId) await fetch(`${endpoint}/json/close/${pageId}`);
  pageId = target.id;
  cdp = await CDP.connect(target.webSocketDebuggerUrl);
  cdp.on('Runtime.exceptionThrown', e => runtimeErrors.push(e.exceptionDetails.exception?.description ?? e.exceptionDetails.text));
  cdp.on('Runtime.consoleAPICalled', e => { if (e.type === 'error') runtimeErrors.push(e.args.map(a => a.value ?? a.description).join(' ')); });
  cdp.on('Network.responseReceived', e => { responses.push({ url: e.response.url, status: e.response.status, mime: e.response.mimeType }); });
  cdp.on('Network.loadingFailed', e => { if (!e.canceled) networkErrors.push({ type: e.type, error: e.errorText }); });
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
  await cdp.send('Page.bringToFront');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `(${browserHelpers.toString()})()` });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: scale, mobile: false,
    screenOrientation: { type: width > height ? 'landscapePrimary' : 'portraitPrimary', angle: width > height ? 90 : 0 },
  });
  await cdp.send('Page.navigate', { url: url.href });
  await waitFor(() => cdp.evaluate(expected => location.href === expected && document.readyState === 'complete' && !!document.querySelector('.hero-booking'), url.href));
  await cdp.evaluate(async () => { await document.fonts.ready; await document.querySelector('.hero-photo img').decode(); });
  await sleep(150);
}
async function key(key, shift = false) {
  const codes = { Tab: 9, Enter: 13, Escape: 27, ' ': 32, ArrowLeft: 37, ArrowRight: 39 };
  const event = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: codes[key], nativeVirtualKeyCode: codes[key], modifiers: shift ? 8 : 0 };
  // Printable keys/Enter need their character payload for native default actions.
  const text = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined;
  await cdp.send('Input.dispatchKeyEvent', { ...event, type: text ? 'keyDown' : 'rawKeyDown', ...(text ? { text, unmodifiedText: text } : {}) });
  await cdp.send('Input.dispatchKeyEvent', { ...event, type: 'keyUp' });
  await sleep(60);
}
async function tabTo(selector) {
  for (let count = 0; count < 90; count++) {
    if (await cdp.evaluate(s => document.activeElement?.matches(s), selector)) return count;
    await key('Tab');
  }
  throw new Error(`Could not reach ${selector} with real Tab input`);
}
async function screenshot(name) {
  if (args.includes('--no-screenshots')) return;
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const path = join(output, `${name}.png`);
  await writeFile(path, Buffer.from(data, 'base64'));
  report.screenshots.push(path);
}

async function viewportChecks(width, height, label, scale = 1) {
  await navigate(width, height, scale);
  const metrics = await cdp.evaluate(() => {
    const ctas = [...document.querySelectorAll('.hero-booking, .header-booking, .mobile-booking-bar .booking-link')].map(e => ({
      class: e.className, rect: __check.rect(e), unobscured: __check.unobscured(e),
    }));
    return { overflow: __check.overflow(), viewport: { width: innerWidth, height: innerHeight, dpr: window.devicePixelRatio },
      composition: { image: __check.rect(document.querySelector('.hero-photo img')), heading: __check.rect(document.querySelector('h1')), heroCopy: __check.rect(document.querySelector('.hero-copy')), facts: __check.rect(document.querySelector('.property-facts')) },
      ctas, header: __check.rect(document.querySelector('.site-header')), sticky: __check.rect(document.querySelector('.mobile-booking-bar')) };
  });
  report.metrics[label] = metrics;
  record(`${label}: no horizontal overflow`, metrics.overflow.excess <= 1 && !metrics.overflow.offenders.length, metrics.overflow);
  record(`${label}: first-screen booking CTA fully visible`, metrics.ctas.some(c => c.unobscured), { ctas: metrics.ctas });
  const hero = await cdp.evaluate(() => {
    const image = document.querySelector('.hero-photo img');
    return { src: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight, complete: image.complete, priority: image.fetchPriority };
  });
  record(`${label}: selected front-house hero decoded`, hero.complete && hero.width > 0 && /^images\/property\/dsc06600-(640|1280|2048)\.webp$/.test(hero.src.replace(url.href, '')), hero);
  const photo = metrics.composition.image;
  record(`${label}: hero photograph keeps its full natural ratio`, Math.abs(photo.width / photo.height - 2048 / 1365) < .01, { image: photo });
  if (height >= 667) record(`${label}: photograph begins within first screen`, photo.top < height - (metrics.sticky?.height ?? 0), { imageTop: photo.top, height });
  await screenshot(`first-${label}`);
  await cdp.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await sleep(100);
  const footer = await cdp.evaluate(() => {
    const items = [...document.querySelectorAll('.site-footer a, .footer-bottom p')];
    return { sticky: __check.rect(document.querySelector('.mobile-booking-bar')), items: items.map(e => ({ text: e.textContent, rect: __check.rect(e), unobscured: __check.unobscured(e) })) };
  });
  report.metrics[label].footer = footer;
  // A tall footer need not fit one short screen: verify its bottom text at the
  // document end and each link after scrolling it into view, without CSS edits.
  const bottomClear = footer.items.slice(-2).every(i => i.unobscured);
  if (width === 320) await screenshot('footer-320');
  const reachable = await cdp.evaluate(async () => {
    const result = [];
    for (const link of document.querySelectorAll('.site-footer a')) {
      link.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(resolve => window.requestAnimationFrame(resolve));
      result.push({ text: link.textContent, unobscured: __check.unobscured(link) });
    }
    return result;
  });
  record(`${label}: footer links/text clear of sticky UI`, bottomClear && reachable.length > 0 && reachable.every(i => i.unobscured), { bottomClear, reachable });
}

async function navigationChecks(width, height, allSections = false) {
  const label = `navigation ${width}x${height}`;
  await navigate(width, height);
  await tabTo('.menu-toggle'); await key('Enter');
  const open = await cdp.evaluate(() => ({ expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'), visible: __check.visible(document.querySelector('#mobile-navigation')), overflow: __check.overflow() }));
  record(`${label}: Enter opens disclosure without overflow`, open.expanded === 'true' && open.visible && open.overflow.excess <= 1, open);
  await key('Tab'); await key('Escape');
  record(`${label}: Escape closes/restores toggle focus`, await cdp.evaluate(() => document.querySelector('#mobile-navigation').hidden && document.activeElement.matches('.menu-toggle')));
  const targets = allSections ? ['the-home', 'sleeping', 'neighborhood', 'reviews', 'good-to-know'] : ['good-to-know'];
  for (const target of targets) {
    await tabTo('.menu-toggle'); await key('Enter');
    await tabTo(`#mobile-navigation a[href="#${target}"]`);
    const visible = await cdp.evaluate(() => __check.unobscured(document.activeElement));
    record(`${label}: ${target} keyboard link reachable/visible`, visible);
    await key('Enter'); await sleep(900);
    const state = await cdp.evaluate(id => ({ closed: document.querySelector('#mobile-navigation').hidden, active: document.activeElement.id, hash: location.hash,
      scrollY: window.scrollY, top: document.getElementById(id).getBoundingClientRect().top, headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom }), target);
    record(`${label}: ${target} closes/focuses section and sets hash`, state.closed && state.active === target && state.hash === `#${target}`, state);
    const inView = state.top >= state.headerBottom - 1 && state.top < height;
    record(`${label}: ${target} destination scrolled into view`, inView, state);
    if (!inView) await screenshot(`nav-${width}x${height}-${target}`);
  }
}

async function galleryChecks(width, height) {
  const label = `gallery ${width}x${height}`;
  await navigate(width, height);
  await tabTo('.gallery-open'); await key('Enter');
  const opened = await cdp.evaluate(() => {
    const dialog = document.querySelector('.gallery-dialog');
    return { modal: dialog.matches(':modal'), focus: document.activeElement.getAttribute('aria-label'), bodyOverflow: getComputedStyle(document.body).overflow,
      rect: __check.rect(dialog), closeVisible: __check.unobscured(dialog.querySelector('button')), overflow: __check.overflow() };
  });
  record(`${label}: keyboard Enter opens modal/close focus`, opened.modal && opened.focus === 'Close photo gallery' && opened.bodyOverflow === 'hidden', opened);
  record(`${label}: modal fits/close visible/no overflow`, opened.closeVisible && opened.rect?.top >= 0 && opened.rect?.bottom <= height + 1 && opened.overflow.excess <= 1, opened);
  const steps = [];
  for (const shift of [false, false, true, true]) {
    await key('Tab', shift);
    steps.push(await cdp.evaluate(() => ({ tag: document.activeElement.tagName, inside: document.querySelector('.gallery-dialog').contains(document.activeElement) })));
  }
  // Native Chrome can briefly put focus on BODY when cycling browser chrome; it
  // must never land on a background interactive element, and must cycle back in.
  record(`${label}: Tab/Shift+Tab cannot focus background controls`, steps.every(s => s.inside || s.tag === 'BODY') && steps.some(s => s.inside), { steps });
  const isolation = await cdp.evaluate(() => {
    const background = document.querySelector('.menu-toggle');
    const before = document.activeElement;
    background.focus();
    const blocked = document.activeElement !== background;
    before.focus();
    const point = document.elementFromPoint(30, 30);
    return { blocked, hit: point?.tagName, hitInside: !!point?.closest('.gallery-dialog') };
  });
  record(`${label}: native modal background focus/hit-test isolation`, isolation.blocked && isolation.hitInside, isolation);
  await screenshot(`modal-${width}x${height}`);
  await key('Escape');
  await waitFor(() => cdp.evaluate(() => !document.querySelector('.gallery-dialog').open));
  record(`${label}: Escape closes/restores opener/unlocks scroll`, await cdp.evaluate(() => document.activeElement.matches('.gallery-open') && getComputedStyle(document.body).overflow !== 'hidden'));
  const collection = await cdp.evaluate(() => ({ previews: document.querySelectorAll('.gallery-open').length, arrows: document.querySelectorAll('.dialog-footer button').length, count: document.querySelector('#photo-number').options.length }));
  record(`${label}: five previews and full 57-photo collection`, collection.previews === 5 && collection.arrows === 2 && collection.count === 57, collection);
  await key('Enter');
  await key('ArrowLeft');
  record(`${label}: left arrow wraps to last photo`, await cdp.evaluate(() => document.querySelector('#photo-number').value === '56' && document.querySelector('#gallery-caption').textContent.includes('57 / 57')));
  await key('ArrowRight');
  record(`${label}: right arrow wraps to first photo`, await cdp.evaluate(() => document.querySelector('#photo-number').value === '0' && document.querySelector('#gallery-caption').textContent.includes('1 / 57')));
  await tabTo('[aria-label="Next property photo"]'); await key('Enter');
  record(`${label}: next button advances photo`, await cdp.evaluate(() => document.querySelector('#photo-number').value === '1'));
  await tabTo('[aria-label="Previous property photo"]'); await key('Enter');
  record(`${label}: previous button returns photo`, await cdp.evaluate(() => document.querySelector('#photo-number').value === '0'));
  await tabTo('#photo-number'); await key('ArrowRight');
  // Native select keys differ by OS; ensure gallery's global arrow handler did
  // not steal focus from the select, then test its change event deterministically.
  record(`${label}: photo selector retains keyboard focus`, await cdp.evaluate(() => document.activeElement.id === 'photo-number'));
  await cdp.evaluate(() => {
    const select = document.querySelector('#photo-number');
    select.value = '22'; select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  record(`${label}: photo selector jumps to selected photo`, await cdp.evaluate(() => document.querySelector('#gallery-caption').textContent.includes('23 / 57')));
  const closeCenter = await cdp.evaluate(() => {
    const r = document.querySelector('.dialog-heading button').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...closeCenter, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...closeCenter, button: 'left', clickCount: 1 });
  await sleep(100);
  record(`${label}: close button pointer click closes/restores focus`, await cdp.evaluate(() => !document.querySelector('.gallery-dialog').open && document.activeElement.matches('.gallery-open')));
  await tabTo('.gallery-view-all'); await key('Enter'); await key('Escape');
  record(`${label}: view-all opens and restores its own focus`, await cdp.evaluate(() => !document.querySelector('.gallery-dialog').open && document.activeElement.matches('.gallery-view-all')));
}

async function fullCollectionChecks() {
  await navigate(1440, 900);
  await tabTo('.gallery-view-all'); await key('Enter');
  const count = await cdp.evaluate(() => document.querySelector('#photo-number').options.length);
  const photos = [];
  for (let index = 0; index < count; index++) {
    await cdp.evaluate(index => {
      const select = document.querySelector('#photo-number');
      select.value = String(index); select.dispatchEvent(new Event('change', { bubbles: true }));
    }, index);
    await sleep(40);
    photos.push(await cdp.evaluate(async () => {
      const image = document.querySelector('.dialog-inner > img');
      await image.decode();
      return { src: image.currentSrc, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight };
    }));
  }
  record('Collection: all 57 photos decode with unique sources and alt labels', photos.length === 57 && new Set(photos.map(photo => photo.src)).size === 57 && photos.every(photo => photo.width > 0 && photo.alt), { count: photos.length });
  const variants = await cdp.evaluate(async () => {
    const image = document.querySelector('.dialog-inner > img');
    const stems = [...document.querySelector('#photo-number').options].slice(1).length;
    const results = [];
    for (const source of image.srcset.split(',').map(part => part.trim().split(' ')[0])) {
      const sample = new Image(); sample.src = source; await sample.decode();
      results.push({ width: sample.naturalWidth, src: sample.src });
    }
    return { count: stems, results };
  });
  record('Collection: real 640/1280/2048 responsive widths', variants.results.map(result => result.width).join(',') === '640,1280,2048', variants);
  report.metrics.collection = photos;
}

async function faqChecks() {
  await navigate(390, 844);
  const count = await cdp.evaluate(() => document.querySelectorAll('.faq-list details').length);
  record('FAQ: five disclosures present', count === 5, { count });
  for (let i = 1; i <= count; i++) {
    const selector = `.faq-list details:nth-child(${i}) summary`;
    await tabTo(selector); await key('Enter');
    const opened = await cdp.evaluate(s => { const e = document.querySelector(s); return e.parentElement.open && __check.visible(e.nextElementSibling) && document.activeElement === e; }, selector);
    await key(' ');
    const closed = await cdp.evaluate(s => { const e = document.querySelector(s); return !e.parentElement.open && document.activeElement === e; }, selector);
    record(`FAQ ${i}: real Tab/Enter opens, Space closes/retains focus`, opened && closed, { opened, closed });
  }
}

async function assetsAndContent() {
  await navigate(1440, 900);
  const surfaces = await cdp.evaluate(() => Object.fromEntries(
    ['.site-header', '.hero', '#the-home', '#sleeping', '.coastal-amenities', '#neighborhood', '.coastal-reviews', '.faq-section', '.booking-section', '.site-footer']
      .map(selector => { const style = getComputedStyle(document.querySelector(selector)); return [selector, { color: style.backgroundColor, image: style.backgroundImage }]; }),
  ));
  record('Modern coastal design: textured tonal hero, deep-blue sleeping and sunlit invitation',
    ['.hero', '#sleeping', '#neighborhood', '.booking-section'].every(selector => surfaces[selector].image.includes('linear-gradient') && surfaces[selector].image.includes('url(')) &&
    surfaces['#the-home'].color === 'rgba(0, 0, 0, 0)' && surfaces['#sleeping'].color === 'rgb(16, 47, 76)', surfaces);
  report.metrics.coastalSurfaces = surfaces;
  const assets = await cdp.evaluate(async () => {
    const images = [...document.images];
    const decoded = await Promise.all(images.map(async image => {
      // Force off-screen lazy previews to load for this asset audit only.
      image.loading = 'eager';
      try { await image.decode(); return { src: image.currentSrc, ok: true, width: image.naturalWidth, height: image.naturalHeight, alt: image.alt }; }
      catch (error) { return { src: image.src, ok: false, error: error.message }; }
    }));
    const urls = [...new Set([...document.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="icon"], link[rel="modulepreload"]')].map(e => e.src || e.href))];
    const fetched = await Promise.all(urls.map(async src => {
      const response = await fetch(src); const text = await response.text();
      return { src, status: response.status, type: response.headers.get('content-type'), bytes: new TextEncoder().encode(text).length,
        xmlError: src.endsWith('.svg') ? new DOMParser().parseFromString(text, 'image/svg+xml').querySelector('parsererror')?.textContent ?? null : null };
    }));
    const icon = new Image(); icon.src = document.querySelector('link[rel="icon"]').href;
    let iconDecoded = true; try { await icon.decode(); } catch { iconDecoded = false; }
    return { decoded, fetched, iconDecoded };
  });
  report.metrics.assets = assets;
  record('Assets: hero, five previews and four editorial images decode', assets.decoded.length === 10 && assets.decoded.every(a => a.ok && a.alt), assets.decoded);
  const copy = await cdp.evaluate(() => {
    const clone = document.querySelector('main').cloneNode(true);
    clone.querySelectorAll('.review-quote').forEach(quote => quote.remove());
    return {
      headline: document.querySelector('h1').textContent,
      intro: document.querySelector('.home-intro > p').textContent,
      hero: document.querySelector('.hero-copy').textContent,
      ownerNote: document.querySelector('.owner-note > p').textContent,
      nonGuestCooking: /cooking|cook at home|shared meals|real meals/i.test(clone.textContent),
      quoteUnchanged: [...document.querySelectorAll('.review-quote blockquote')].some(quote => quote.textContent.includes('the upgraded kitchen had every item we needed for cooking.')),
    };
  });
  record('Copy: Tampa launchpad headline and Armature Works home-base story', copy.headline === 'Your Tampa launchpad.' && copy.intro === 'Slow morning or straight out the door? Blue Bliss is your Tampa Heights launchpad, close to Armature Works and ready for your plans. Explore downtown, head to the conference or golf course, or make a day of Tampa Bay. Come back to a space that is all yours.' && copy.hero.includes('Stay in Tampa Heights, close to Armature Works.'), copy);
  const cityDesign = await cdp.evaluate(() => {
    return {
      panoramaAbsent: !document.querySelector('.city-panorama'),
      heroDecorationHidden: getComputedStyle(document.querySelector('.hero'), '::before').display === 'none',
      location: document.querySelector('.city-orientation strong').textContent,
    };
  });
  record('City design: no illustrated skyline; Tampa Heights location retained', cityDesign.panoramaAbsent && cityDesign.heroDecorationHidden && cityDesign.location === 'Tampa Heights', cityDesign);
  record('Copy: longer owner description retained below hero, no promotional cooking copy', copy.ownerNote.includes('glass of wine/beer or a game of bocce') && copy.ownerNote.includes('new outdoor shower') && !copy.hero.includes('glass of wine/beer') && !copy.nonGuestCooking && copy.quoteUnchanged, copy);
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
    await navigate(width, height);
    const frames = await cdp.evaluate(async () => {
      const images = [...document.querySelectorAll('.hero-photo img, .story-photo img, .booking-photo img')];
      for (const image of images) { image.loading = 'eager'; await image.decode(); }
      return images.map(image => ({ src: image.currentSrc, box: __check.rect(image), naturalRatio: image.naturalWidth / image.naturalHeight }));
    });
    record(`Editorial ${width}: every supporting image rendered uncropped`, frames.every(frame => Math.abs(frame.box.width / frame.box.height - frame.naturalRatio) < .01), frames);
    const buttonCount = await cdp.evaluate(() => document.querySelectorAll('.story-photo, .gallery-open').length);
    for (let index = 0; index < buttonCount; index++) {
      const action = await cdp.evaluate(async index => {
        const button = document.querySelectorAll('.story-photo, .gallery-open')[index];
        const image = button.querySelector('img');
        image.loading = 'eager'; await image.decode();
        const label = button.querySelector('.photo-action');
        label.scrollIntoView({ block: 'center', behavior: 'instant' });
        await new Promise(resolve => window.requestAnimationFrame(resolve));
        const rect = label.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const css = getComputedStyle(label);
        return { visible: __check.unobscured(label), belowImage: rect.top >= imageRect.bottom - 1,
          height: rect.height, fontSize: parseFloat(css.fontSize), label: label.textContent.trim(),
          x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }, index);
      record(`Photo controls ${width}/${index + 1}: readable, uncovered, 44px action below image`, action.visible && action.belowImage && action.height >= 44 && action.fontSize >= 12 && action.label === 'View photo', action);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: action.x, y: action.y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: action.x, y: action.y, button: 'left', clickCount: 1 });
      await sleep(80);
      const opened = await cdp.evaluate(() => document.querySelector('.gallery-dialog').open);
      await key('Escape');
      const restored = await cdp.evaluate(index => document.activeElement === document.querySelectorAll('.story-photo, .gallery-open')[index], index);
      record(`Photo controls ${width}/${index + 1}: actual pointer opens viewer and Escape restores focus`, opened && restored);
    }
    for (const [name, selector] of [['outdoors', '.stay-outdoor'], ['indoors', '.stay-indoor'], ['sleeping', '#sleeping'], ['city', '#neighborhood'], ['invitation', '.booking-section']]) {
      await cdp.evaluate(selector => document.querySelector(selector).scrollIntoView({ block: 'start', behavior: 'instant' }), selector);
      await screenshot(`editorial-${width}-${name}`);
    }
  }
  record('Performance: closed gallery does not mount a full-size image', await cdp.evaluate(() => !document.querySelector('.dialog-inner > img')));
  record('Assets: scripts/styles/icon return 2xx', assets.fetched.length >= 3 && assets.fetched.every(a => a.status >= 200 && a.status < 300), assets.fetched);
  record('Assets: favicon is valid SVG and browser-decodable', assets.iconDecoded && assets.fetched.every(a => !a.xmlError), { iconDecoded: assets.iconDecoded, svg: assets.fetched.filter(a => a.src.endsWith('.svg')) });
  const links = await cdp.evaluate(() => [...document.querySelectorAll('a')].filter(a => a.matches('.booking-link') || /airbnb/i.test(a.textContent) || /(^|\.)airbnb\.com$/i.test(new URL(a.href).hostname)).map(a => ({ text: a.textContent, href: a.getAttribute('href') })));
  record('Booking: all seven links exactly match supplied Airbnb URL', links.length === 7 && links.every(a => a.href === expectedAirbnb), { expected: expectedAirbnb, links });
  const trust = await cdp.evaluate(() => ({ visibleBadges: [...document.querySelectorAll('.trust-badges')].filter(__check.visible).length,
    claims: document.body.innerText.match(/Superhost|5\.0\s*\/\s*5|15\s+(?:Airbnb\s+)?reviews/gi) ?? [],
    structuredRatings: [...document.querySelectorAll('script[type="application/ld+json"]')].some(e => /aggregateRating/.test(e.textContent)) }));
  record('Trust: unverified rating/count/Superhost badges and structured ratings absent', !trust.visibleBadges && !trust.claims.length && !trust.structuredRatings, trust);
  const metadata = await cdp.evaluate(() => ({ og: document.querySelector('meta[property="og:image"]')?.content, twitter: document.querySelector('meta[name="twitter:image"]')?.content }));
  record('Social metadata: OG/Twitter use based JPEG path', !!metadata.og && new URL(metadata.og).pathname === `${url.pathname}images/hero.jpg` && metadata.twitter === metadata.og, metadata);
  const similarity = await cdp.evaluate(async base => {
    const pixels = (image, scale = 1, dx = 0, dy = 0) => {
      const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 44;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, (64 - 64 * scale) / 2 + dx, (44 - 44 * scale) / 2 + dy, 64 * scale, 44 * scale);
      return { rgba: context.getImageData(0, 0, 64, 44).data, data: canvas.toDataURL() };
    };
    const samples = await Promise.all(['hero.avif', 'hero.jpg'].map(async file => {
      const src = new URL(`images/${file}`, base).href;
      const response = await fetch(src); const bytes = (await response.arrayBuffer()).byteLength;
      const image = new Image(); image.src = src; await image.decode();
      return { file, bytes, width: image.naturalWidth, height: image.naturalHeight, image, ...pixels(image) };
    }));
    const compare = (a, b, margin = 0) => {
      let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, squareError = 0;
      for (let y = margin; y < 44 - margin; y++) for (let x = margin; x < 64 - margin; x++) for (let channel = 0; channel < 3; channel++) {
        const i = (y * 64 + x) * 4 + channel, av = a[i], bv = b[i];
        n++; sa += av; sb += bv; saa += av * av; sbb += bv * bv; sab += av * bv; squareError += (av - bv) ** 2;
      }
      return { correlation: (sab - sa * sb / n) / Math.sqrt((saa - sa * sa / n) * (sbb - sb * sb / n)), normalizedRMSE: Math.sqrt(squareError / n) / 255 };
    };
    const raw = compare(samples[0].rgba, samples[1].rgba);
    // Different export dimensions can shift edges by a pixel. Test a bounded
    // +/-2px translation and +/-4% scale, comparing the common inner region.
    // Retain raw metrics: registration is supporting evidence, not exact equality.
    let registered = { ...raw, scale: 1, dx: 0, dy: 0 };
    for (const scale of [.96, .98, 1, 1.02, 1.04]) for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const result = compare(pixels(samples[0].image, scale, dx, dy).rgba, samples[1].rgba, 4);
      if (result.correlation > registered.correlation) registered = { ...result, scale, dx, dy };
    }
    return { samples: samples.map(({ rgba: _rgba, image: _image, ...sample }) => sample), ...raw, registered, downsample: '64x44 RGB', note: 'Diagnostic similarity only, not an authenticity test.' };
  }, url.href);
  for (const sample of similarity.samples) {
    await writeFile(join(output, `${sample.file}-64x44.png`), Buffer.from(sample.data.split(',')[1], 'base64'));
    delete sample.data;
  }
  report.metrics.socialSimilarity = similarity;
  console.log(`INFO Social image comparison: correlation ${similarity.registered.correlation.toFixed(3)}, normalized RMSE ${similarity.registered.normalizedRMSE.toFixed(3)}`);
  skip('Social JPEG: owner approval of identity/crop/rights', 'Different supplied exports; pixel similarity cannot verify provenance. Metrics retained in report.');
}

async function reducedMotion() {
  await navigate(390, 844);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const motion = await cdp.evaluate(() => ({ matches: matchMedia('(prefers-reduced-motion: reduce)').matches, scroll: getComputedStyle(document.documentElement).scrollBehavior,
    offenders: [...document.querySelectorAll('*')].flatMap(e => [null, '::before', '::after'].flatMap(pseudo => {
      const s = getComputedStyle(e, pseudo);
      return s.animationName !== 'none' || s.transitionDuration.split(',').some(t => parseFloat(t) !== 0) ? [{ tag: e.tagName, class: e.getAttribute('class'), pseudo, animation: s.animationName, transition: s.transitionDuration }] : [];
    })) }));
  record('Reduced motion: computed auto scroll/no animations or transitions incl. pseudo-elements', motion.matches && motion.scroll === 'auto' && !motion.offenders.length, motion);
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });
}

async function axeAudit() {
  if (args.includes('--no-axe')) { skip('axe-core audit', '--no-axe supplied'); return; }
  let source;
  try {
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    source = await response.text();
  } catch (error) { skip('axe-core audit', `Optional CDN unavailable: ${error.message}`); return; }
  for (const state of ['mobile', 'desktop', 'expanded-disclosures', 'modal']) {
    await navigate(state === 'desktop' ? 1440 : 390, state === 'desktop' ? 900 : 844);
    if (state === 'expanded-disclosures') {
      for (const selector of ['.owner-note summary', '.more-reviews summary', ...Array.from({ length: 5 }, (_, i) => `.faq-list details:nth-child(${i + 1}) summary`)]) {
        await tabTo(selector); await key('Enter');
      }
    }
    if (state === 'modal') { await tabTo('.gallery-open'); await key('Enter'); }
    await cdp.send('Runtime.evaluate', { expression: source });
    const audit = await cdp.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
      return { version: axe.version, passes: result.passes.length, incomplete: result.incomplete.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })),
        violations: result.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) };
    });
    report.metrics[`axe-${state}`] = audit;
    record(`axe-core ${state}: no WCAG A/AA or best-practice violations`, !audit.violations.length, audit);
  }
}

try {
  if (typeof WebSocket !== 'function') throw new Error('Node native WebSocket required (Node 22+ recommended)');
  let available = false;
  try { available = (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok; } catch { /* Start only local absent preview. */ }
  if (!available) {
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Remote target unavailable; refusing to start a local preview for it');
    preview = launch(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', url.hostname, '--port', url.port || '4173', '--strictPort'], 'preview');
    await waitFor(async () => (await fetch(url, { signal: AbortSignal.timeout(1000) })).ok);
  }
  chrome = launch(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', 'about:blank',
  ], 'chrome');
  const port = await waitFor(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
  endpoint = `http://127.0.0.1:${port}`;
  report.metrics.browser = await (await fetch(`${endpoint}/json/version`)).json();
  const targets = await (await fetch(`${endpoint}/json/list`)).json();
  pageId = targets.find(t => t.type === 'page')?.id;
  const viewports = [[320, 568], [375, 667], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [568, 320], [667, 375], [844, 390], [1024, 375]];
  for (const [width, height] of viewports) await scenario(`viewport ${width}x${height}`, () => viewportChecks(width, height, `${width}x${height}`));
  for (const [width, height] of [[720, 450], [512, 384]]) await scenario(`200% reflow ${width}x${height}`, () => viewportChecks(width, height, `reflow-200-${width}x${height}`, 2));
  await scenario('Assets/content/social checks', assetsAndContent);
  for (const [w, h, all] of [[390, 844, true], [568, 320, false], [1024, 375, false]]) await scenario(`Navigation ${w}x${h}`, () => navigationChecks(w, h, all));
  for (const [w, h] of [[390, 844], [1440, 900], [568, 320]]) await scenario(`Gallery ${w}x${h}`, () => galleryChecks(w, h));
  await scenario('Full collection checks', fullCollectionChecks);
  await scenario('FAQ keyboard checks', faqChecks);
  await scenario('Reduced motion checks', reducedMotion);
  await scenario('axe audit', axeAudit);
  record('Runtime: no uncaught exceptions/console errors', runtimeErrors.length === 0, { errors: runtimeErrors });
  const badResponses = responses.filter(r => r.status >= 400);
  record('Network: no failed requests or HTTP errors', !networkErrors.length && !badResponses.length, { networkErrors, badResponses });
  report.metrics.network = { responseCount: responses.length, uniqueResponses: [...new Map(responses.map(r => [r.url, r])).values()] };
} catch (error) {
  record('Browser harness setup/execution', false, { error: error.stack, logs });
} finally {
  try { await cleanup(); record('Cleanup: owned browser/preview stopped and profile removed', true); }
  catch (error) { record('Cleanup', false, { error: error.message }); }
  clearTimeout(watchdog);
  report.finished = new Date().toISOString();
  report.summary = Object.fromEntries(['PASS', 'FAIL', 'SKIP'].map(status => [status, report.tests.filter(t => t.status === status).length]));
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(join(output, 'browser.log'), logs.chrome);
  console.log(`\n${JSON.stringify(report.summary)}\nReport: ${join(output, 'report.json')}\nScreenshots: ${report.screenshots.join('\n')}`);
  process.exitCode = report.summary.FAIL ? 1 : 0;
}