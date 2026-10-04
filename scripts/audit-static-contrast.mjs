#!/usr/bin/env node
/*
 * Static WCAG contrast audit over the built static/SSG pages.
 *
 * Purpose: this repository cannot run Playwright in every environment (no browser
 * binary, blocked CDN), but the colour half of the axe result must still be
 * provable on every build. This audit loads each prerendered HTML page with the
 * built CSS, resolves each text node's effective colour and its nearest opaque
 * backdrop with a small cascade resolver, and fails when the ratio is below the
 * WCAG 2.2 AA minimum (4.5:1 normal text, 3:1 large text).
 *
 * Scope, stated honestly: it resolves plain colours and rgb()/rgba() stacking. It
 * skips elements whose visible backdrop comes from a gradient or an image and
 * reports them as skipped instead of guessing. It is a regression gate for the
 * static pages, not a replacement for a real browser and screen reader pass.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { JSDOM } from "jsdom";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, ".next/server/app");
const CSS_DIR = join(ROOT, ".next/static/css");
const ONLY_PATHS = (process.env.STATIC_CONTRAST_PATHS ?? "").split(",").map((item) => item.trim()).filter(Boolean);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

export function parseColor(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  if (text === "transparent" || text === "none") return { r: 0, g: 0, b: 0, a: 0 };
  if (text === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (text === "black") return { r: 0, g: 0, b: 0, a: 1 };
  const hex = text.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let body = hex[1];
    if (body.length === 3 || body.length === 4) body = body.split("").map((c) => c + c).join("");
    return {
      r: parseInt(body.slice(0, 2), 16),
      g: parseInt(body.slice(2, 4), 16),
      b: parseInt(body.slice(4, 6), 16),
      a: body.length >= 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1,
    };
  }
  const rgb = text.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : 1 };
    }
  }
  return null;
}

export function over(front, back) {
  if (!front) return back;
  if (front.a >= 1) return { r: front.r, g: front.g, b: front.b, a: 1 };
  const a = front.a + back.a * (1 - front.a);
  if (a === 0) return { r: front.r, g: front.g, b: front.b, a: 0 };
  const mix = (f, b) => (f * front.a + b * back.a * (1 - front.a)) / a;
  return { r: mix(front.r, back.r), g: mix(front.g, back.g), b: mix(front.b, back.b), a };
}

export function luminance({ r, g, b }) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(front, back) {
  const l1 = luminance(front);
  const l2 = luminance(back);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function specificity(selector) {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g) ?? []).length;
  const tags = (selector.replace(/[#.][\w-]+|\[[^\]]+\]|:[\w-]+|[*>+~,\s]/g, " ").match(/[a-zA-Z][\w-]*/g) ?? []).length;
  return ids * 100 + classes * 10 + tags;
}

export function loadRules(cssText) {
  const clean = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  const mediaRe = /@media([^{]+)\{/g;
  let mediaMatch;
  while ((mediaMatch = mediaRe.exec(clean))) {
    const start = mediaRe.lastIndex;
    let depth = 1;
    let cursor = start;
    while (cursor < clean.length && depth > 0) {
      if (clean[cursor] === "{") depth += 1;
      else if (clean[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    blocks.push({ media: mediaMatch[1].trim(), body: clean.slice(start, cursor - 1) });
    mediaRe.lastIndex = cursor;
  }
  const withoutMedia = clean.replace(/@media[^{]+\{([\s\S]*?)\}\s*(\}|\s)/g, "\n");
  const rules = [];
  let order = 0;
  const push = (selector, body, media) => {
    const declarations = {};
    for (const piece of body.split(";")) {
      const at = piece.indexOf(":");
      if (at < 0) continue;
      const prop = piece.slice(0, at).trim().toLowerCase();
      if (!prop) continue;
      declarations[prop] = piece.slice(at + 1).trim();
    }
    if (!declarations.color && !declarations["-webkit-text-fill-color"] && !declarations["background-color"] && !declarations.background && !Object.keys(declarations).some((prop) => prop.startsWith("--"))) return;
    for (const raw of selector.split(",")) {
      const text = raw.trim();
      if (!text || text.startsWith("@") || text.includes("::") || /@/.test(text)) continue;
      const stripped = text.replace(/:hover|:focus-visible|:focus|:active|:disabled|:checked|:target|:not\([^)]*\)/g, "");
      if (!stripped) continue;
      rules.push({ selector: stripped, raw: text, declarations, specificity: specificity(stripped), order: order++, media: media ?? null });
    }
  };
  for (const block of blocks) {
    const inner = /([^{}]+)\{([^{}]*)\}/g;
    let match;
    while ((match = inner.exec(block.body))) push(match[1], match[2], block.media);
  }
  const plain = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = plain.exec(withoutMedia))) push(match[1], match[2], null);
  return rules;
}

function colorTokenOf(value) {
  if (typeof value !== "string") return null;
  for (const token of value.trim().split(/\s+/).reverse()) {
    if (parseColor(token)) return token;
  }
  return null;
}

export function collectCustomProperties(rules) {
  const vars = new Map();
  for (const rule of rules) {
    if (!/(^|\s|,)(:root|html|body|\*)(\s|$|,|$)/.test(rule.raw ?? rule.selector)) continue;
    for (const [prop, value] of Object.entries(rule.declarations)) {
      if (prop.startsWith("--")) vars.set(prop, value);
    }
  }
  return vars;
}

export function substituteVars(value, vars, depth = 0) {
  if (typeof value !== "string" || !value.includes("var(") || depth > 8) return value;
  const next = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_all, name, fallback) => {
    const resolved = vars.get(name);
    if (resolved !== undefined) return resolved;
    if (fallback !== undefined) return fallback.trim();
    return "";
  });
  return next === value ? next : substituteVars(next, vars, depth + 1);
}

export function indexRules(rules) {
  // Index every rule by the compound selector that actually matches the element
  // (the rightmost one). Indexing by any class in the selector would never test
  // descendant rules such as `.side-coach-card p` on the paragraph itself.
  const byClass = new Map();
  const byTag = new Map();
  const byId = new Map();
  const universal = [];
  const add = (map, key, rule) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(rule);
  };
  for (const rule of rules) {
    const subject = rule.selector.split(/[\s>+~]+/).filter(Boolean).pop() ?? rule.selector;
    const classes = subject.match(/\.[\w-]+/g)?.map((item) => item.slice(1)) ?? [];
    const id = subject.match(/#([\w-]+)/)?.[1];
    const tags = subject.replace(/[#.][\w-]+|\[[^\]]+\]|:[\w-]+(?:\([^)]*\))?|[*]/g, " ").match(/[a-zA-Z][\w-]*/g) ?? [];
    let indexed = false;
    if (id) { add(byId, id, rule); indexed = true; }
    for (const cls of classes) { add(byClass, cls, rule); indexed = true; }
    for (const tag of tags) { add(byTag, tag.toLowerCase(), rule); indexed = true; }
    if (!indexed) universal.push(rule);
  }
  return { byClass, byTag, byId, universal };
}

export function makeResolver(rules, index, customProperties) {
  const cache = new Map();
  const window = null;
  const candidates = (element) => {
    const out = new Set(index.universal);
    const tag = element.tagName.toLowerCase();
    for (const rule of index.byTag.get(tag) ?? []) out.add(rule);
    if (element.id) for (const rule of index.byId.get(element.id) ?? []) out.add(rule);
    for (const cls of element.classList) for (const rule of index.byClass.get(cls) ?? []) out.add(rule);
    return [...out];
  };
  return (element, key) => {
    // The cache key must include the ancestor chain: descendant selectors such as
    // `.side-coach-card p` make two class-less paragraphs resolve differently.
    const chainKey = [];
    let walker = element;
    while (walker && chainKey.length < 12) {
      chainKey.push(`${walker.tagName.toLowerCase()}.${String(walker.className).split(" ").join(".")}`);
      walker = walker.parentElement;
    }
    const parent = element.parentElement;
    const position = parent ? [...parent.children].indexOf(element) : 0;
    const attributes = element.getAttributeNames().sort().join(",");
    const signature = `${chainKey.join(">")}|${element.tagName.toLowerCase()}|${element.id}|${[...element.classList].sort().join(".")}|${parent ? parent.tagName.toLowerCase() : ""}${position}|${attributes}`;
    let entry = cache.get(signature);
    if (!entry) {
      const matched = [];
      for (const rule of candidates(element)) {
        let ok = false;
        try {
          ok = element.matches(rule.selector);
        } catch {
          ok = false;
        }
        if (ok) matched.push(rule);
      }
      matched.sort((a, b) => (a.specificity - b.specificity) || (a.order - b.order));
      const style = {};
      for (const rule of matched) {
        for (const [prop, value] of Object.entries(rule.declarations)) {
          const resolved = substituteVars(value, customProperties);
          if (prop === "background-color") style.__bg = resolved;
          else if (prop === "background") {
            // The shorthand resets background-color; keep the colour and flag images.
            style.__bgImage = /gradient|url\(/.test(resolved) ? "1" : "";
            style.__bg = colorTokenOf(resolved) ?? "";
          }
          style[prop] = resolved;
        }
      }
      entry = { style, matched };
      cache.set(signature, entry);
    }
    return key ? entry.style[key] : entry;
  };
}

export function backgroundOf(resolve, element) {
  // Collect every declared background from the element up to the root, then
  // composite them from the outermost (opaque base first) inward. Stopping at the
  // first translucent layer would read a white overlay as the page background.
  const layers = [];
  let node = element;
  while (node) {
    const style = resolve(node).style;
    if (style.__bgImage) return { gradient: true };
    const background = style.__bg;
    if (background) {
      const parsed = colorTokenOf(background);
      if (parsed) {
        const colour = parseColor(parsed);
        if (colour) layers.push(colour);
      }
    }
    node = node.parentElement;
  }
  let color = { r: 255, g: 255, b: 255, a: 1 };
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (layer.a <= 0) continue;
    color = over(layer, color);
  }
  return { color };
}

if (process.env.STATIC_CONTRAST_LIB !== "1") {
  const allPages = walk(APP_DIR).filter((path) => path.endsWith(".html"));
  const pages = ONLY_PATHS.length
    ? allPages.filter((path) => ONLY_PATHS.includes(relative(APP_DIR, path).replace(/\.html$/, "").replace(/\/index$/, "") || "index"))
    : allPages;
  const css = walk(CSS_DIR).filter((path) => path.endsWith(".css")).map((path) => readFileSync(path, "utf8")).join("\n");
  if (!allPages.length || !css) {
    console.error("Static contrast audit needs a production build first (.next/server/app + .next/static/css).");
    process.exit(2);
  }
  const rules = loadRules(css);
  const index = indexRules(rules);
  const customProperties = collectCustomProperties(rules);
  if (process.env.STATIC_CONTRAST_DEBUG) {
    const probe = rules.filter((rule) => rule.selector.includes(process.env.STATIC_CONTRAST_DEBUG));
    console.error(`DEBUG rules matching ${process.env.STATIC_CONTRAST_DEBUG}: ${probe.length}`);
    for (const rule of probe.slice(0, 6)) console.error(`  sel=${rule.selector} spec=${rule.specificity} order=${rule.order} color=${rule.declarations.color ?? "-"} media=${rule.media ?? "-"}`);
    console.error(`DEBUG custom props: ${customProperties.size}, --fs-7=${customProperties.get("--fs-7")}`);
  }
  const findings = [];
  let unresolvedCount = 0;
  let auditedElements = 0;
  for (const page of pages) {
    const dom = new JSDOM(readFileSync(page, "utf8"));
    const { document } = dom.window;
    const resolve = makeResolver(rules, index, customProperties);
    for (const element of document.querySelectorAll("body *")) {
      const hasOwnText = [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim().length > 1);
      if (!hasOwnText) continue;
      if (element.closest("[aria-hidden='true'], [hidden]")) continue;
      const inlineStyle = element.getAttribute("style") ?? "";
      if (/display\s*:\s*none|visibility\s*:\s*hidden/.test(inlineStyle)) continue;
      // Only visible text matters for WCAG contrast: skip anything hidden by the
      // cascade (display/visibility/opacity) or folded inside a closed <details>.
      let hidden = false;
      let probe = element;
      while (probe && probe !== document.documentElement) {
        const probeStyle = resolve(probe).style;
        if (probeStyle.display === "none" || probeStyle.visibility === "hidden" || probeStyle.opacity === "0") { hidden = true; break; }
        if (probe.tagName === "DETAILS" && !probe.hasAttribute("open") && !element.closest("summary")) { hidden = true; break; }
        probe = probe.parentElement;
      }
      if (hidden) continue;
      auditedElements += 1;
      const chain = [];
      let node = element;
      while (node && chain.length < 24) { chain.push(node); node = node.parentElement; }
      let declared = resolve(element).style["-webkit-text-fill-color"] ?? resolve(element).style.color;
      if (!declared) {
        for (const ancestor of chain.slice(1)) {
          const value = resolve(ancestor).style.color;
          if (value) { declared = value; break; }
        }
      }
      const front = parseColor(declared ?? "#000000");
      if (!front) continue;
      let size = parseFloat(resolve(element).style["font-size"] ?? "");
      let weight = parseInt(resolve(element).style["font-weight"] ?? "", 10);
      if (!Number.isFinite(size) || !Number.isFinite(weight)) {
        for (const ancestor of chain.slice(1)) {
          if (!Number.isFinite(size)) size = parseFloat(resolve(ancestor).style["font-size"] ?? "");
          if (!Number.isFinite(weight)) weight = parseInt(resolve(ancestor).style["font-weight"] ?? "", 10);
          if (Number.isFinite(size) && Number.isFinite(weight)) break;
        }
      }
      if (!Number.isFinite(size)) size = 16;
      if (!Number.isFinite(weight)) weight = 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const backdropResult = backgroundOf(resolve, element);
      if (process.env.STATIC_CONTRAST_DEBUG_TEXT && (element.textContent ?? "").includes(process.env.STATIC_CONTRAST_DEBUG_TEXT)) {
      const ancestors = [];
      let walker = element;
      while (walker && ancestors.length < 10) { ancestors.push(`${walker.tagName.toLowerCase()}${walker.className ? "." + String(walker.className).split(" ").join(".") : ""}`); walker = walker.parentElement; }
      console.error(`TEXTDEBUG "${(element.textContent ?? "").trim().slice(0, 40)}" color=${declared} backdrop=${JSON.stringify(backdropResult)} chain=${ancestors.join(" < ")}`);
    }
    if (process.env.STATIC_CONTRAST_DEBUG && String(element.className).includes(process.env.STATIC_CONTRAST_DEBUG) && findings.length < 6) {
        const dbg = resolve(element);
        console.error(`DEBUGSTYLE classes=${JSON.stringify([...element.classList])} style=${JSON.stringify(dbg.style).slice(0, 200)} matched=${dbg.matched.map((rule) => rule.selector).slice(0, 8).join(" | ")}`);
        console.error("DBG declared:", JSON.stringify(declared), "style.color:", JSON.stringify(resolve(element).color));
        console.error(`DEBUG <${element.tagName.toLowerCase()} class="${String(element.className).slice(0,60)}"> color=${declared} size=${size} weight=${weight} backdrop=${JSON.stringify(backdropResult)} chain=${chain.map((item) => item.tagName.toLowerCase() + "." + String(item.className).slice(0, 24)).join(" < ")}`);
      }
      if (backdropResult.gradient) { unresolvedCount += 1; continue; }
      const backdrop = backdropResult.color;
      const effective = over(front, backdrop);
      const ratio = contrast(effective, backdrop);
      const minimum = large ? 3 : 4.5;
      if (ratio + 0.005 < minimum) {
        findings.push({
          path: relative(APP_DIR, page).replace(/\.html$/, ""),
          tag: element.tagName.toLowerCase(),
          className: String(element.className).slice(0, 80),
          text: (element.textContent ?? "").trim().slice(0, 48),
          color: declared,
          backdrop: `rgb(${Math.round(backdrop.r)}, ${Math.round(backdrop.g)}, ${Math.round(backdrop.b)})`,
          ratio: Math.round(ratio * 100) / 100,
          minimum,
          large,
        });
      }
    }
  }
  const byPath = new Map();
  for (const finding of findings) byPath.set(finding.path, (byPath.get(finding.path) ?? 0) + 1);
  const worst = [...findings].sort((a, b) => a.ratio - b.ratio).slice(0, 20);
  console.log(`Static WCAG contrast audit: ${pages.length} built pages · ${rules.length} style rules · ${auditedElements} text elements · ${findings.length} below-minimum · ${unresolvedCount} skipped (gradient/image backdrop)`);
  for (const [path, count] of [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`- ${path}: ${count}`);
  for (const finding of worst) console.log(`  ${finding.ratio}:1 (min ${finding.minimum}) ${finding.path} <${finding.tag} class="${finding.className}"> "${finding.text}" ${finding.color} on ${finding.backdrop}`);
  if (process.env.STATIC_CONTRAST_JSON) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.env.STATIC_CONTRAST_JSON, JSON.stringify({ pages: pages.length, rules: rules.length, findings, unresolvedCount }, null, 1));
}
const limit = Number(process.env.STATIC_CONTRAST_LIMIT ?? "0");
  if (findings.length > limit) {
    console.error(`Static contrast audit failed: ${findings.length} text nodes below WCAG AA (limit ${limit}).`);
    process.exit(1);
  }
  console.log("Static contrast audit passed: every resolved text element meets WCAG AA contrast.");

}
