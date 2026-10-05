// Shared behaviour for every page. Loaded as <script type="module" src="/js/site.js">.
const HAIRLINE = "https://esm.sh/@lucasmarkes/hairline@0.2.0";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 0. Theme: light by default; the nav toggle switches to dark and remembers it.
const root = document.documentElement;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toggle = document.querySelector(".theme-toggle");
function applyTheme(dark) {
  if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
  if (toggle) toggle.setAttribute("aria-pressed", String(dark));
  if (themeMeta) themeMeta.content = dark ? "#0f1012" : "#f5f5f3";
}
applyTheme(root.getAttribute("data-theme") === "dark");
toggle?.addEventListener("click", () => {
  const dark = root.getAttribute("data-theme") !== "dark";
  applyTheme(dark);
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
});

// 1. Sections fade up as they are reached.
const reveals = document.querySelectorAll(".reveal");
if (reduced || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  reveals.forEach((el) => io.observe(el));
}

// Never print or save a page with sections still waiting to fade in.
addEventListener("beforeprint", () => reveals.forEach((el) => el.classList.add("is-in")));

// 2. Figures. Stock: data-figure="terminal". Custom: data-figure-src="/assets/figures/x.js".
// The fallback <img> stays visible unless the live figure mounts.
async function mountFigure(slot) {
  const opts = {
    intensity: Number(slot.dataset.intensity || 0.4),
    theme: "auto", // follows data-theme on <html>
    label: slot.dataset.label,
  };
  const readout = slot.parentElement.querySelector(".fig__read");
  // The first caption is the figure at rest; only show captions while it is being used.
  let rest;
  if (readout) opts.onRead = (t) => { rest ??= t; readout.textContent = t === rest ? "" : t; };
  try {
    let fig;
    if (slot.dataset.figureSrc) {
      const mod = await import(slot.dataset.figureSrc);
      fig = mod.mount(slot, opts);
    } else {
      const lib = await import(HAIRLINE);
      const make = lib[slot.dataset.figure];
      if (typeof make !== "function") throw new Error(`unknown figure ${slot.dataset.figure}`);
      fig = make(slot, opts);
    }
    slot.classList.add("is-live");
    return fig;
  } catch (err) {
    console.warn("Figure fell back to static image:", err);
  }
}
const slots = document.querySelectorAll("figure[data-figure]");
if (slots.length) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { mountFigure(e.target); io.unobserve(e.target); }
  }, { rootMargin: "200px" });
  slots.forEach((s) => io.observe(s));
}

// 3. Active nav item.
const here = location.pathname.replace(/index\.html$/, "");
document.querySelectorAll(".nav__links a").forEach((a) => {
  if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
});

// 3b. Copy the email address. Clipboard first; if the browser refuses, select the text so it can be copied by hand.
document.querySelectorAll(".copy[data-copy]").forEach((btn) => {
  const label = btn.querySelector(".copy__label"), status = btn.nextElementSibling;
  const email = btn.closest(".contact-line")?.querySelector(".contact-line__email");
  let timer;
  btn.addEventListener("click", async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.classList.add("is-copied");
      label.textContent = "Copied";
      if (status) status.textContent = "Email address copied";
      timer = setTimeout(() => { btn.classList.remove("is-copied"); label.textContent = "Copy"; if (status) status.textContent = ""; }, 2000);
    } catch {
      if (email) { const r = document.createRange(); r.selectNodeContents(email); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      const key = /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl";
      label.textContent = `Press ${key}+C`;
      if (status) status.textContent = `Email address selected. Press ${key}+C to copy it.`;
      timer = setTimeout(() => { label.textContent = "Copy"; if (status) status.textContent = ""; }, 4000);
    }
  });
});

// 3c. Links that open a new tab say so: an icon for the eye, words for screen readers.
document.querySelectorAll('a[target="_blank"]').forEach((a) => {
  if (a.classList.contains("ext") || a.querySelector(".sr-only")) return;
  if (!a.classList.contains("post")) a.classList.add("ext");
  const note = document.createElement("span");
  note.className = "sr-only";
  note.textContent = " (opens in a new tab)";
  a.append(note);
});

// 4. Medium posts (home page only). The static link in the markup is the fallback.
const posts = document.getElementById("medium-posts");
if (posts) {
  const RSS = "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@lawrencenjobo";
  fetch(RSS)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("RSS failed"))))
    .then((data) => {
      const items = (data.items || []).slice(0, 3);
      if (!items.length) return;
      posts.replaceChildren(...items.map((p) => {
        const a = document.createElement("a");
        a.className = "post";
        a.href = p.link;
        a.target = "_blank";
        a.rel = "noopener";
        const date = new Date(p.pubDate.replace(" ", "T")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const meta = document.createElement("div"); meta.className = "post__meta"; meta.textContent = `Medium, ${date}`;
        const h = document.createElement("h3"); h.textContent = p.title;
        const note = document.createElement("span"); note.className = "sr-only"; note.textContent = " (opens in a new tab)";
        a.append(meta, h, note);
        return a;
      }));
    })
    .catch(() => {});
}
