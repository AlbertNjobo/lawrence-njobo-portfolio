// scripts/check-site.mjs — run: node scripts/check-site.mjs
// Zero-dependency checks for the static site. Exits 1 on any failure.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;

// Add a page here in the same task that builds it (TDD: add, see it fail, build, see it pass).
export const PAGES = [
  {
    path: "index.html",
    mustContain: [
      "From procurement agents to learning games for children who learn differently.",
      "Procurely", "Brightpath", "BloodChain", "Sentinel API",
      "Operations Collaborator", "Marketing and Analytics Lead", "CompTIA Security+",
      "Vice Chancellor",
    ],
    mustNotContain: ["awaiting graduation", "AI safety", "Hello."],
  },
  {
    path: "credentials.html",
    mustContain: ["CompTIA Security+", "Associate Cloud Engineer", "AZ-900", "Generative AI Leader",
      "Certified iMIS Administrator", "2025 to 2026", "Hashgraph Developer Course", "Code in Place", "GCI World"],
    mustNotContain: ["Hedera Hashgraph Developer"],
  },
  { path: "work/procurely.html", mustContain: ["Procurely", "purchase order", "ProcurePilot"] },
  { path: "work/brightpath.html", mustContain: ["Brightpath", "Shona", "Pathfinder", "78", "LetterLight"] },
  { path: "work/bloodchain.html", mustContain: ["BloodChain", "Hedera", "final year project", "Joseph Mutengeni"] },
  { path: "work/sentinel-api.html", mustContain: ["Sentinel API", "FastAPI", "Nginx"], mustNotContain: ["log aggregation", "dashboards"] },
];

// URLs the site must never link, one per line. Kept in a local, git-ignored file.
const FORBIDDEN_FILE = join(ROOT, "scripts/forbidden-links.txt");
const FORBIDDEN_LINKS = existsSync(FORBIDDEN_FILE)
  ? readFileSync(FORBIDDEN_FILE, "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
  : [];
const NAV_LINKS = ["/#work", "/#writing", "/credentials.html", "/#about"];

const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ");
}

for (const page of PAGES) {
  const file = join(ROOT, page.path);
  if (!existsSync(file)) { fail(page.path, "file missing"); continue; }
  const html = readFileSync(file, "utf8");
  const text = visibleText(html);

  if (!/<title>[^<]{3,}<\/title>/.test(html)) fail(page.path, "missing <title>");
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fail(page.path, "missing meta description");
  if (!html.includes('<html lang="en-GB">')) fail(page.path, 'html lang must be "en-GB"');
  if (!/href="\/css\/style\.css(\?v=[0-9a-f]+)?"/.test(html)) fail(page.path, "stylesheet not linked");
  if (!/<script type="module" src="\/js\/site\.js(\?v=[0-9a-f]+)?">/.test(html)) fail(page.path, "site.js not loaded as module");
  // Every versioned asset must carry the hash of its current contents (python3 scripts/stamp-assets.py).
  for (const m of html.matchAll(/(\/(?:css\/style\.css|js\/site\.js|assets\/figures\/[\w-]+\.js))(?:\?v=([0-9a-f]+))?"/g)) {
    const want = createHash("sha256").update(readFileSync(join(ROOT, m[1]))).digest("hex").slice(0, 10);
    if (m[2] !== want) fail(page.path, `stale or missing version stamp on ${m[1]} (run scripts/stamp-assets.py)`);
  }
  for (const l of NAV_LINKS) if (!html.includes(`href="${l}"`)) fail(page.path, `nav link ${l} missing`);
  if (!html.includes('class="footer"')) fail(page.path, "footer missing");
  if (!html.includes('property="og:image"') || !html.includes('rel="canonical"')) fail(page.path, "share preview or canonical tag missing");
  if (!html.includes('class="theme-toggle"')) fail(page.path, "theme toggle missing");
  if (!html.includes('localStorage.getItem("theme")')) fail(page.path, "pre-paint theme script missing");
  if (text.includes("—")) fail(page.path, "em dash in visible text");
  if (text.includes("–")) fail(page.path, "en dash in visible text");
  if (html.includes("fonts.googleapis.com")) fail(page.path, "Google Fonts link (self-host instead)");
  for (const line of text.split("\n")) if ((line.match(/·/g) || []).length > 1) fail(page.path, `more than one middle dot on a line: "${line.trim().slice(0, 60)}"`);
  // Eyebrow budget: at most one small uppercase label per three sections (hero counts).
  const sections = (html.match(/<section[\s>]/g) || []).length;
  const eyebrows = (html.match(/class="eyebrow"/g) || []).length;
  if (eyebrows > Math.max(1, Math.ceil(sections / 3))) fail(page.path, `${eyebrows} eyebrows for ${sections} sections`);
  if (/iconify/i.test(html)) fail(page.path, "Iconify still referenced");
  for (const l of FORBIDDEN_LINKS) if (html.includes(l)) fail(page.path, `forbidden link ${l}`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(page.path, "must have exactly one <h1>");

  // Every figure slot carries a fallback image that exists on disk.
  for (const m of html.matchAll(/<figure[^>]*data-figure[^>]*>([\s\S]*?)<\/figure>/g)) {
    const src = (m[1].match(/class="fig__fallback"[^>]*src="([^"]+)"/) || m[1].match(/src="([^"]+)"[^>]*class="fig__fallback"/) || [])[1];
    if (!src) fail(page.path, "figure without .fig__fallback img");
    else if (!existsSync(join(ROOT, src))) fail(page.path, `fallback missing on disk: ${src}`);
    if (!/data-label="[^"]{10,}"/.test(m[0])) fail(page.path, "figure without data-label");
  }

  // Internal links resolve to files.
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    let p = m[1];
    if (p === "/" ) p = "/index.html";
    if (p.endsWith("/")) p += "index.html";
    if (!existsSync(join(ROOT, p))) fail(page.path, `broken internal link ${m[1]}`);
  }

  for (const s of page.mustContain || []) if (!text.includes(s)) fail(page.path, `missing text: "${s}"`);
  for (const s of page.mustNotContain || []) if (text.includes(s)) fail(page.path, `stale text present: "${s}"`);
}

if (PAGES.length === 0) fail("(suite)", "no pages registered yet");
if (failures.length) {
  console.error(failures.map((f) => "FAIL " + f).join("\n"));
  process.exit(1);
}
console.log(`OK ${PAGES.length} page(s) checked`);
