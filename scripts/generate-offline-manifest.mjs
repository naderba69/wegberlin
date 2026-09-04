import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routes = new Set();
/** المسارات المشتركة: يحتاجها كل مستوى، لأن التنقل والتقدم والمكتبة ليست حصرية لمستوى واحد. */
const coreRoutes = new Set([
  "/",
  "/today",
  "/path",
  "/diagnostic",
  "/review",
  "/practice",
  "/library",
  "/search",
  "/writing",
  "/speaking",
  "/mediation",
  "/shadowing",
  "/errors",
  "/tutor",
  "/exams",
  "/progress",
  "/settings",
  "/manifest.webmanifest",
]);
for (const route of coreRoutes) routes.add(route);
const levelRoutes = { a1: new Set(), a2: new Set(), b1: new Set(), b2: new Set() };

const pad = (value) => String(value).padStart(2, "0");

for (const [level, lessonCount, moduleCount] of [
  ["a1", 24, 8],
  ["a2", 24, 8],
  ["b1", 24, 8],
  ["b2", 12, 6],
]) {
  for (let lesson = 1; lesson <= lessonCount; lesson += 1) {
    const route = `/lernen/${level}-${pad(lesson)}`;
    routes.add(route);
    levelRoutes[level].add(route);
  }
  for (let moduleNumber = 1; moduleNumber <= moduleCount; moduleNumber += 1) {
    const route = `/module/${level}-${moduleNumber}`;
    routes.add(route);
    levelRoutes[level].add(route);
  }
  const assessmentRoute = `/assessment/${level}`;
  routes.add(assessmentRoute);
  levelRoutes[level].add(assessmentRoute);
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

for (const [provider, taskIds] of Object.entries(targeted)) {
  for (const taskId of taskIds) {
    const route = `/exams/${provider}/${taskId}`;
    routes.add(route);
    levelRoutes.b2.add(route);
  }
}

for (let simulation = 2; simulation <= 6; simulation += 1) {
  const number = pad(simulation);
  for (let part = 1; part <= 5; part += 1) { const route = `/exams/goethe-b2/goethe-b2-full-${number}-reading-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
  for (let part = 1; part <= 4; part += 1) { const route = `/exams/goethe-b2/goethe-b2-full-${number}-listening-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
  for (let part = 1; part <= 2; part += 1) { const route = `/exams/goethe-b2/goethe-b2-full-${number}-writing-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
  for (let part = 1; part <= 2; part += 1) { const route = `/exams/goethe-b2/goethe-b2-full-${number}-speaking-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }

  for (let part = 1; part <= 3; part += 1) { const route = `/exams/telc-deutsch-b2/telc-b2-full-${number}-reading-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
  for (let part = 1; part <= 2; part += 1) { const route = `/exams/telc-deutsch-b2/telc-b2-full-${number}-language-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
  for (let part = 1; part <= 3; part += 1) { const route = `/exams/telc-deutsch-b2/telc-b2-full-${number}-listening-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
  const telcWritingRoute = `/exams/telc-deutsch-b2/telc-b2-full-${number}-writing-01`;
  routes.add(telcWritingRoute);
  levelRoutes.b2.add(telcWritingRoute);
  for (let part = 1; part <= 3; part += 1) { const route = `/exams/telc-deutsch-b2/telc-b2-full-${number}-speaking-${pad(part)}`; routes.add(route); levelRoutes.b2.add(route); }
}

for (let simulation = 1; simulation <= 6; simulation += 1) {
  const number = pad(simulation);
  for (const route of [`/exams/goethe-b2/full/goethe-b2-full-${number}`, `/exams/telc-deutsch-b2/full/telc-b2-full-${number}`]) {
    routes.add(route);
    levelRoutes.b2.add(route);
  }
}

const sorted = [...routes].sort();
const packRoutes = (extra) => [...new Set([...coreRoutes, ...extra])].sort();

const manifest = {
  format: "dwnb-offline-routes",
  version: 2,
  routeCount: routes.size,
  routes: sorted,
  // كل حزمة مستوى = المسارات المشتركة + مسارات ذلك المستوى. B2 تضم مسارات الامتحان لأنها B2 حصرًا.
  levelPacks: {
    full: { routeCount: sorted.length, routes: sorted },
    A1: { routeCount: packRoutes(levelRoutes.a1).length, routes: packRoutes(levelRoutes.a1) },
    A2: { routeCount: packRoutes(levelRoutes.a2).length, routes: packRoutes(levelRoutes.a2) },
    B1: { routeCount: packRoutes(levelRoutes.b1).length, routes: packRoutes(levelRoutes.b1) },
    B2: { routeCount: packRoutes(levelRoutes.b2).length, routes: packRoutes(levelRoutes.b2) },
  },
  coreRouteCount: coreRoutes.size,
};

await writeFile(resolve(root, "public/offline-routes.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.routeCount} offline routes and ${Object.keys(manifest.levelPacks).length} pack scopes.`);
for (const [scope, pack] of Object.entries(manifest.levelPacks)) console.log(`- ${scope}: ${pack.routeCount} routes`);
