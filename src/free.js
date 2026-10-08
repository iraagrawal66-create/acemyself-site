// Free hub + Dear Future Me. Routes are registered from main.js via Object.assign(pages, freePages(page)).
// To add another free feature later: add a route here and a new entry in the hub's "More little things" area.
export const freePages = (page) => ({
  "/free": () => `
<section class="fh-hero"><div class="w">
  <p class="eb">Something free? 🎀</p>
  <h1 class="fh-title">Worth a little detour.</h1>
  <p class="fh-sub">Free little things to help you learn, grow &amp; ace yourself.</p>
</div></section>
<section class="fh-fs"><div class="w">
  <article class="fh-feat">
    <span class="fh-em" aria-hidden="true">💌</span>
    <div class="fh-body">
      <h2>Dear Future Me</h2>
      <p class="fh-lede">Write something your future self should read.</p>
      <p class="fh-desc">A little message to yourself, delivered 6 months from now.</p>
      <a class="btn fh-cta" href="#/free/dear-future-me">WRITE TO FUTURE ME →</a>
    </div>
  </article>
</div></section>
<section class="fh-more"><div class="w">
  <h2>More little things are coming.</h2>
  <p>Quizzes, prompts, guides, tools and tiny things that might make your day a little better.</p>
</div></section>`,

  "/free/dear-future-me": () => dfmPage(),
});

/* ================= Dear Future Me ================= */
export const PROMPTS = [
  "I hope that in 6 months, I…",
  "Dear future me, I hope you remember…",
  "Something I really want to change is…",
  "I hope you're proud of yourself because…",
  "If everything goes a little better than I expect, then…",
];

// Exactly N calendar months later, capped to the last valid day of the target month (31 Aug + 6 -> 28/29 Feb).
export function addMonthsCapped(d, n = 6) {
  const total = d.getMonth() + n;
  const y = d.getFullYear() + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), last));
}
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmt = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
// Uses the visitor's LOCAL calendar date (not UTC) so the date never shifts by a day.
export const deliveryFrom = (now = new Date()) => addMonthsCapped(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 6);

const dfmPage = () => {
  const i = Math.floor(Math.random() * PROMPTS.length);
  return `
<section class="dfm-hero"><div class="w dfm-w">
  <p class="eb">A little note to your future self</p>
  <h1 class="dfm-title">Dear Future Me</h1>
  <p class="dfm-sub">What do you want to tell yourself 6 months from now?</p>
  <p class="dfm-sub2">Write it down. We’ll keep it safe until then. 💌</p>
</div></section>
<section class="dfm-sec"><div class="w dfm-w">
<form id="dfm" data-i="${i}" novalidate>
  <p class="dfm-prompt" id="dfm-prompt" aria-live="polite">${PROMPTS[i]}</p>
  <button type="button" class="dfm-swap" id="dfm-swap">↻ Give me a different prompt</button>
  <label class="dfm-vh" for="dfm-msg">Your message to your future self</label>
  <textarea id="dfm-msg" name="message" rows="9" maxlength="5000" placeholder="Dear future me, …"></textarea>
  <p class="er" id="e-dfm-msg"></p>
  <p class="dfm-date">We’ll send this to you on <b id="dfm-d">${fmt(deliveryFrom())}</b>.<span>That’s 6 months from today.</span></p>
  <h2 class="dfm-h2">Where should we send it?</h2>
  <label class="dfm-vh" for="dfm-mail">Your email</label>
  <input type="email" id="dfm-mail" name="email" placeholder="you@example.com" autocomplete="email" inputmode="email">
  <p class="er" id="e-dfm-mail"></p>
  <p class="hint">We’ll only use your email for your future-self message. No spam. Promise.</p>
  <button class="btn dfm-go" type="submit">SEND TO FUTURE ME →</button>
  <div id="dfm-m" role="status"></div>
</form>
</div></section>`;
};

const successHtml = (when, programHref) => `
<div class="dfm-done" tabindex="-1">
  <h2 class="dfm-ok">It’s saved. 💌</h2>
  <p class="dfm-big">Six months from now, you’ll get to meet this version of yourself again.</p>
  <p class="dfm-when">Your message is scheduled for <b>${fmt(when)}</b>.</p>
  <div class="dfm-next">
    <h3>Make your 6-months-from-now self a little more proud. 🫶</h3>
    <p>Learn something new. Build your confidence. Become a little better at something that matters to you.</p>
    <p class="dfm-q">Want to start today?</p>
    <a class="btn dfm-cta2" href="${programHref}">EXPLORE COMMUNICATION &amp; PUBLIC SPEAKING →</a>
  </div>
</div>`;

export function bindDfm({ getClient, programHref }) {
  const f = document.getElementById("dfm");
  if (!f) return;
  let idx = +f.dataset.i, sending = false;
  const pe = document.getElementById("dfm-prompt");
  document.getElementById("dfm-swap").onclick = () => {
    let n;
    do { n = Math.floor(Math.random() * PROMPTS.length); } while (n === idx && PROMPTS.length > 1);
    idx = n; pe.textContent = PROMPTS[n];
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const msgEl = f.elements.message, mailEl = f.elements.email;
    const message = msgEl.value.trim(), email = mailEl.value.trim();
    let ok = true, first = null;
    const mark = (el, id, text) => {
      el.setAttribute("aria-invalid", text ? "true" : "false");
      document.getElementById(id).textContent = text || "";
      if (text) { ok = false; first = first || el; }
    };
    mark(msgEl, "e-dfm-msg", message ? "" : "Write a little something first.");
    mark(mailEl, "e-dfm-mail", !email ? "Please add your email." : /^\S+@\S+\.\S+$/.test(email) ? "" : "That email doesn’t look quite right.");
    if (!ok) { first.focus(); return; }
    const btn = f.querySelector(".dfm-go"), note = document.getElementById("dfm-m");
    note.innerHTML = "";
    const when = deliveryFrom();            // recalculated at send time
    sending = true; btn.disabled = true; btn.textContent = "SAVING…"; btn.setAttribute("aria-busy", "true");
    try {
      const client = getClient();
      if (!client) throw new Error("not configured");
      const { error } = await client.from("future_messages").insert({ message, email, delivery_date: ymd(when), status: "scheduled" });
      if (error) throw error;
      const box = f.closest(".dfm-w");
      box.innerHTML = successHtml(when, programHref);
      const d = box.querySelector(".dfm-done");
      try { d.focus({ preventScroll: true }); d.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (_) {}
    } catch (_) {
      console.error("Future message save failed");
      sending = false; btn.disabled = false; btn.textContent = "SEND TO FUTURE ME →"; btn.removeAttribute("aria-busy");
      note.innerHTML = `<div class="msg no">Something went wrong. Your note wasn’t saved. Please try again.</div>`;
    }
  };
}
