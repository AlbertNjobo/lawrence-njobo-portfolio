// Shared behaviour for every page. Loaded as <script type="module" src="/js/site.js">.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 0. Theme: light by default; the nav toggle switches to dark and remembers it.
const root = document.documentElement;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toggle = document.querySelector(".theme-toggle");
function applyTheme(dark) {
  if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
  if (toggle) toggle.setAttribute("aria-pressed", String(dark));
  if (themeMeta) themeMeta.content = dark ? "#16181b" : "#ffffff";
}
applyTheme(root.getAttribute("data-theme") === "dark");
toggle?.addEventListener("click", () => {
  const dark = root.getAttribute("data-theme") !== "dark";
  try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) { applyTheme(dark); return; }
  const box = toggle.getBoundingClientRect();
  const x = box.left + box.width / 2, y = box.top + box.height / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add("theme-switching");
  const t = document.startViewTransition(() => applyTheme(dark));
  t.ready.then(() => root.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
    { duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
  ));
  t.finished.finally(() => root.classList.remove("theme-switching"));
});

// 1. Things arrive as they are reached. Children of a [data-stagger] group cascade, at most six steps deep;
// data-stagger="clip" unrolls them from the bottom edge instead of rising.
document.querySelectorAll("[data-stagger]").forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.classList.add("reveal");
    if (group.dataset.stagger === "clip") child.classList.add("reveal--clip");
    child.style.setProperty("--i", Math.min(i, 6));
  });
});
document.querySelectorAll(".footer__mark").forEach((m) => m.classList.add("reveal"));
const reveals = document.querySelectorAll(".reveal");
if (reduced || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  // Anything already on screen shows at once; only what is below the fold waits to fade in.
  reveals.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in"); });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  reveals.forEach((el) => { if (!el.classList.contains("is-in")) io.observe(el); });
  document.documentElement.classList.add("reveal-on");
}

// Never print or save a page with sections still waiting to fade in.
addEventListener("beforeprint", () => reveals.forEach((el) => el.classList.add("is-in")));
// Arriving through a view transition: show the project tiles at once, so a screenshot morphs into a visible tile.
addEventListener("pagereveal", (e) => {
  if (!e.viewTransition) return;
  document.querySelectorAll(".reveal--clip").forEach((el) => {
    el.querySelector(".work__media")?.style.setProperty("transition", "none");
    el.classList.add("is-in");
  });
});

// 2b. On a mouse, a "View case study" label follows the pointer across each project image.
if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll(".work__media").forEach((media) => {
    const label = media.querySelector(".work__cursor");
    if (!label) return;
    let frame;
    media.addEventListener("pointermove", (e) => {
      const box = media.getBoundingClientRect();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        label.style.setProperty("--x", `${e.clientX - box.left}px`);
        label.style.setProperty("--y", `${e.clientY - box.top}px`);
      });
    });
  });
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
  if (a.classList.contains("ext") || /new tab/.test(a.textContent)) return;
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
  // Give the feed six seconds; on any failure the static link to Medium stays.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  fetch(RSS, { signal: ctrl.signal })
    .finally(() => clearTimeout(timer))
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
        const h = document.createElement("h3"); h.textContent = p.title; a.title = p.title;
        const note = document.createElement("span"); note.className = "sr-only"; note.textContent = " (opens in a new tab)";
        a.append(meta, h, note);
        return a;
      }));
    })
    .catch(() => {});
}

// Everything above ran: show the controls that depend on it.
document.documentElement.classList.add("site-ready");
