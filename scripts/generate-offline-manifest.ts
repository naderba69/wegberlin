import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { curriculum } from "../src/data/curriculum";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const commonRoutes = [
  "/",
  "/today",
  "/path",
  "/diagnostic",
  "/review",
  "/practice",
  "/practice/collocations",
  "/practice/conversation-paths",
  "/practice/dictation",
  "/practice/practical-day",
  "/library",
  "/search",
  "/writing",
  "/speaking",
  "/mediation",
  "/shadowing",
  "/errors",
  "/tutor",
  "/progress",
  "/settings",
  "/privacy",
  "/portfolio/writing",
  "/status",
  "/offline",
  "/manifest.webmanifest",
];
const routes = new Set(commonRoutes);

const pad = (value: number) => String(value).padStart(2, "0");

// Published lesson and module counts are read from the curriculum itself, so a new lesson can
// never be shipped without its Offline pack route. The previous hand-written per-level numbers
// silently left /lernen/b2-14 out of every pack.
const publishedByLevel = curriculum
  .filter((lesson) => lesson.status === "published")
  .reduce<Record<string, { lessonCount: number; moduleCount: number }>>((acc, lesson) => {
    const level = lesson.level.toLowerCase();
    const entry = acc[level] ?? { lessonCount: 0, moduleCount: 0 };
    entry.lessonCount += 1;
    entry.moduleCount = Math.max(entry.moduleCount, lesson.module);
    acc[level] = entry;
    return acc;
  }, {});

for (const [level, { lessonCount, moduleCount }] of Object.entries(publishedByLevel)) {
  for (let lesson = 1; lesson <= lessonCount; lesson += 1) routes.add(`/lernen/${level}-${pad(lesson)}`);
  for (let moduleNumber = 1; moduleNumber <= moduleCount; moduleNumber += 1) routes.add(`/module/${level}-${moduleNumber}`);
  routes.add(`/assessment/${level}`);
}

const targeted = {
  "goethe-b2": [
    ...Array.from({ length: 4 }, (_, index) => `goethe-b2-reading-${pad(index + 1)}`),
    ...Array.from({ length: 4 }, (_, index) => `goethe-b2-listening-${pad(index + 1)}`),
    ...Array.from({ length: 2 }, (_, index) => `goethe-b2-writing-${pad(index + 1)}`),
    ...Array.from({ length: 2 }, (_, index) => `goethe-b2-speaking-${pad(index + 1)}`),
    "goethe-b2-full-01-reading-05",
  ],
  "telc-deutsch-b2": [
    ...Array.from({ length: 3 }, (_, index) => `telc-b2-reading-${pad(index + 1)}`),
    ...Array.from({ length: 2 }, (_, index) => `telc-b2-language-${pad(index + 1)}`),
    ...Array.from({ length: 3 }, (_, index) => `telc-b2-listening-${pad(index + 1)}`),
    "telc-b2-writing-01",
    ...Array.from({ length: 3 }, (_, index) => `telc-b2-speaking-${pad(index + 1)}`),
  ],
};

routes.add("/exams");
for (const [provider, taskIds] of Object.entries(targeted)) {
  for (const taskId of taskIds) routes.add(`/exams/${provider}/${taskId}`);
}

for (let simulation = 2; simulation <= 6; simulation += 1) {
  const number = pad(simulation);
  for (let part = 1; part <= 5; part += 1) routes.add(`/exams/goethe-b2/goethe-b2-full-${number}-reading-${pad(part)}`);
  for (let part = 1; part <= 4; part += 1) routes.add(`/exams/goethe-b2/goethe-b2-full-${number}-listening-${pad(part)}`);
  for (let part = 1; part <= 2; part += 1) routes.add(`/exams/goethe-b2/goethe-b2-full-${number}-writing-${pad(part)}`);
  for (let part = 1; part <= 2; part += 1) routes.add(`/exams/goethe-b2/goethe-b2-full-${number}-speaking-${pad(part)}`);

  for (let part = 1; part <= 3; part += 1) routes.add(`/exams/telc-deutsch-b2/telc-b2-full-${number}-reading-${pad(part)}`);
  for (let part = 1; part <= 2; part += 1) routes.add(`/exams/telc-deutsch-b2/telc-b2-full-${number}-language-${pad(part)}`);
  for (let part = 1; part <= 3; part += 1) routes.add(`/exams/telc-deutsch-b2/telc-b2-full-${number}-listening-${pad(part)}`);
  routes.add(`/exams/telc-deutsch-b2/telc-b2-full-${number}-writing-01`);
  for (let part = 1; part <= 3; part += 1) routes.add(`/exams/telc-deutsch-b2/telc-b2-full-${number}-speaking-${pad(part)}`);
}

for (let simulation = 1; simulation <= 6; simulation += 1) {
  const number = pad(simulation);
  routes.add(`/exams/goethe-b2/full/goethe-b2-full-${number}`);
  routes.add(`/exams/telc-deutsch-b2/full/telc-b2-full-${number}`);
}

const sortedRoutes = [...routes].sort();
const packDefinitions = [
  { id: "a1", label: "A1", routes: sortedRoutes.filter((route) => commonRoutes.includes(route) || route.startsWith("/lernen/a1-") || route.startsWith("/module/a1-") || route === "/assessment/a1") },
  { id: "a2", label: "A2", routes: sortedRoutes.filter((route) => commonRoutes.includes(route) || route.startsWith("/lernen/a2-") || route.startsWith("/module/a2-") || route === "/assessment/a2") },
  { id: "b1", label: "B1", routes: sortedRoutes.filter((route) => commonRoutes.includes(route) || route.startsWith("/lernen/b1-") || route.startsWith("/module/b1-") || route === "/assessment/b1") },
  { id: "b2", label: "B2 + Prüfung", routes: sortedRoutes.filter((route) => commonRoutes.includes(route) || route.startsWith("/lernen/b2-") || route.startsWith("/module/b2-") || route === "/assessment/b2" || route.startsWith("/exams")) },
  { id: "full", label: "A1–B2 komplett", routes: sortedRoutes },
].map((pack) => ({ ...pack, routeCount: pack.routes.length, audioScope: pack.id === "full" ? "all" : pack.id }));

const manifest = {
  format: "dwnb-offline-routes",
  version: 2,
  defaultPackId: "full",
  routeCount: sortedRoutes.length,
  routes: sortedRoutes,
  packs: packDefinitions,
};

await writeFile(resolve(root, "public/offline-routes.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.routeCount} offline routes and ${manifest.packs.length} independent packs (${manifest.packs.map((pack) => `${pack.id}:${pack.routeCount}`).join(", ")}).`);
