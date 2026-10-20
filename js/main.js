(() => {
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Entrances: each [data-reveal] rises once as it enters. Nothing stays hidden if the observer is missing. */
function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

/* Rolling figures: each digit rolls up to its value once. The real figure stays readable for screen readers. */
function initRolls() {
  const els = [...document.querySelectorAll('[data-roll]')];
  els.forEach((el) => {
    const value = el.textContent.trim();
    const said = Object.assign(document.createElement('span'), { className: 'sr-only', textContent: value });
    const shown = Object.assign(document.createElement('span'), { className: 'roll__digits' });
    shown.setAttribute('aria-hidden', 'true');
    let i = 0;
    for (const ch of value) {
      if (!/\d/.test(ch)) { shown.append(ch); continue; }
      const col = Object.assign(document.createElement('span'), { className: 'roll__col' });
      const strip = Object.assign(document.createElement('span'), { className: 'roll__strip' });
      // the 0–9 strip is drawn by CSS (::before), so the page text holds only the real figure
      strip.style.setProperty('--d', ch);
      strip.style.setProperty('--i', i++);
      col.append(strip);
      shown.append(col);
    }
    el.classList.add('roll');
    el.replaceChildren(said, shown);
  });
  if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach((el) => io.observe(el));
}

/* The bar drops in once the giant name has left the screen. */
function initBar() {
  const bar = document.querySelector('[data-bar]');
  const title = document.querySelector('.hero__name-wrap');
  if (!bar || !title || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([e]) => {
    const past = !e.isIntersecting && e.boundingClientRect.top < 0;
    bar.classList.toggle('is-shown', past);
  }, { threshold: 0 });
  io.observe(title);
}

/* Phone menu: a native modal dialog, so focus and Escape are handled by the browser. */
function initMenu() {
  const menu = document.getElementById('menu');
  if (!menu || typeof menu.showModal !== 'function') return;
  document.querySelectorAll('[data-menu-open]').forEach((btn) => {
    btn.addEventListener('click', () => menu.showModal());
  });
  menu.querySelector('[data-menu-close]')?.addEventListener('click', () => menu.close());
  menu.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => menu.close()));
}

/* Get tested: one stage open at a time. */
function initSteps() {
  const list = document.querySelector('[data-steps]');
  if (!list) return;
  const steps = [...list.querySelectorAll('.step')];
  const open = (step) => {
    steps.forEach((s) => {
      const on = s === step;
      s.classList.toggle('is-open', on);
      s.querySelector('.step__tab').setAttribute('aria-expanded', String(on));
    });
  };
  steps.forEach((step) => {
    step.querySelector('.step__tab').addEventListener('click', () => open(step));
  });
}

/* Myth or fact: the visitor calls each statement, sees the answer, and keeps a running score. */
function initQuiz() {
  const quiz = document.querySelector('[data-quiz]');
  if (!quiz) return;
  const scoreEl = document.querySelector('[data-score]');
  const done = document.querySelector('[data-done]');
  const result = document.querySelector('[data-result]');
  const items = [...quiz.querySelectorAll('.myth')];
  const total = items.length;
  let answered = 0;
  let right = 0;

  const label = (v) => (v === 'myth' ? 'Myth' : 'Fact');
  const updateScore = () => {
    scoreEl.textContent = answered === 0
      ? `Your score: 0 of ${total}`
      : `Your score: ${right} right, ${answered} of ${total} answered`;
  };

  items.forEach((item) => {
    const call = item.querySelector('.myth__call');
    const original = call.innerHTML;
    item.dataset.original = original;

    item.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-call]');
      if (!btn || item.classList.contains('is-answered')) return;
      const ok = btn.dataset.call === item.dataset.truth;
      answered += 1;
      if (ok) right += 1;
      item.classList.add('is-answered', ok ? 'is-right' : 'is-wrong');
      const mark = document.createElement('p');
      mark.className = 'myth__mark';
      mark.textContent = ok ? `${label(btn.dataset.call)}. Right` : `${label(btn.dataset.call)}. Not quite`;
      item.querySelector('.myth__call').replaceWith(mark);
      const answer = item.querySelector('[data-answer]');
      answer.setAttribute('tabindex', '-1');
      answer.focus({ preventScroll: true });
      updateScore();
      if (answered === total) finish();
    });
  });

  function finish() {
    result.textContent = right === total
      ? `${right} out of ${total}. You know the facts. Now make sure you know your status.`
      : `${right} out of ${total}. Now you know the facts, know your status too.`;
    done.hidden = false;
  }

  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    answered = 0; right = 0;
    items.forEach((item) => {
      item.classList.remove('is-answered', 'is-right', 'is-wrong');
      const mark = item.querySelector('.myth__mark');
      if (mark) {
        const call = document.createElement('div');
        call.className = 'myth__call js-only';
        call.setAttribute('role', 'group');
        call.setAttribute('aria-label', `${item.querySelector('.myth__statement').textContent}: myth or fact?`);
        call.innerHTML = item.dataset.original;
        mark.replaceWith(call);
      }
    });
    done.hidden = true;
    updateScore();
    items[0].querySelector('[data-call]')?.focus();
  });
}

/* ---------- Forms ---------- */
// The two forms write to the same Firestore collections the previous site used:
//   testingRequests   { name, age, province, need, message, createdAt, source: 'website', status: 'new' }
//   newsletterSignups { email, createdAt }
// The Firebase SDK is only downloaded when someone submits, so it costs nothing on page load.

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const EMAIL = 'hello@bevisimpactfoundation.org';

const firebaseConfig = window.BIF_FIREBASE_CONFIG || {};
const isConfigured = () => Object.keys(firebaseConfig).length > 0 && Object.values(firebaseConfig).every((v) => v && !String(v).startsWith('PASTE_'));

let firestore;
function connect() {
  firestore ??= (async () => {
    const [{ initializeApp }, fs] = await Promise.all([
      import(`${SDK}firebase-app.js`),
      import(`${SDK}firebase-firestore.js`),
    ]);
    const app = initializeApp(firebaseConfig);
    return { fs, db: fs.getFirestore(app) };
  })();
  return firestore;
}

async function save(collectionName, data) {
  const { fs, db } = await connect();
  return fs.addDoc(fs.collection(db, collectionName), { ...data, createdAt: fs.serverTimestamp() });
}

const mailto = (subject, body) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

function showStatus(el, text, link) {
  el.replaceChildren(text);
  if (link) {
    const a = Object.assign(document.createElement('a'), { href: link.href, textContent: link.text });
    el.append(' ', a);
  }
}

function initRequest() {
  const form = document.querySelector('[data-request]');
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const submit = form.querySelector('[data-submit]');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const request = {
      name: (data.name || '').trim(),
      age: (data.age || '').trim(),
      province: data.province || '',
      need: data.need || '',
      message: (data.message || '').trim(),
    };

    // mark what is missing, the same four fields the previous site required
    const missing = {
      name: !request.name,
      age: !/^\d{1,2}$/.test(request.age),
      province: !request.province,
      need: !request.need,
    };
    form.querySelector('[name="name"]').closest('.field').classList.toggle('is-invalid', missing.name);
    form.querySelector('[name="age"]').closest('.field').classList.toggle('is-invalid', missing.age);
    form.querySelector('[name="province"]').closest('.chips').classList.toggle('is-invalid', missing.province);
    form.querySelector('[name="need"]').closest('.chips').classList.toggle('is-invalid', missing.need);
    if (Object.values(missing).some(Boolean)) {
      showStatus(status, 'Please complete your name, age, province, and the type of support you need.');
      const first = Object.keys(missing).find((k) => missing[k]);
      form.querySelector(`[name="${first}"]`)?.focus();
      return;
    }

    const body = [
      `Name: ${request.name}`,
      `Age: ${request.age}`,
      `Province: ${request.province}`,
      `Help with: ${request.need}`,
      request.message ? `Message: ${request.message}` : '',
    ].filter(Boolean).join('\n');
    const emailLink = { href: mailto('Testing support request', body), text: 'Send it by email instead.' };

    if (!isConfigured()) {
      showStatus(status, 'Online requests are not switched on yet.', emailLink);
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      await save('testingRequests', { ...request, source: 'website', status: 'new' });
      form.reset();
      showStatus(status, 'Request sent. We will be in touch soon.');
    } catch (err) {
      console.error('Firestore submit error:', err);
      showStatus(status, 'Something went wrong while sending your request.', emailLink);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send request';
    }
  });

  // clear a field's warning as soon as it is filled
  form.addEventListener('input', (ev) => {
    ev.target.closest('.field, .chips')?.classList.remove('is-invalid');
  });
}

function initSignup() {
  const form = document.querySelector('[data-signup]');
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const input = form.querySelector('[name="email"]');
    const email = input.value.trim();
    if (!input.checkValidity() || !email) {
      showStatus(status, 'Please enter a valid email address.');
      input.focus();
      return;
    }
    const emailLink = { href: mailto('Please add me to your updates', `Please add ${email} to the Bevis Impact Foundation updates.`), text: 'Subscribe by email instead.' };
    if (!isConfigured()) {
      showStatus(status, 'Online sign-up is not switched on yet.', emailLink);
      return;
    }
    button.disabled = true;
    try {
      await save('newsletterSignups', { email });
      form.reset();
      showStatus(status, 'You are subscribed. Thank you.');
    } catch (err) {
      console.error('Newsletter signup error:', err);
      showStatus(status, 'That did not go through.', emailLink);
    } finally {
      button.disabled = false;
    }
  });
}

function initForms() {
  initRequest();
  initSignup();
}

initRolls();
initReveals();
initBar();
initMenu();
initSteps();
initQuiz();
initForms();

// tells the failsafe in <head> that everything above ran
window.__bif = true;
})();
