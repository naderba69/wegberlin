import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routes = new Set([
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

const pad = (value) => String(value).padStart(2, "0");

for (const [level, lessonCount, moduleCount] of [
  ["a1", 24, 8],
  ["a2", 24, 8],
  ["b1", 24, 8],
  ["b2", 12, 6],
]) {
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

const manifest = {
  format: "dwnb-offline-routes",
  version: 1,
  routeCount: routes.size,
  routes: [...routes].sort(),
};

await writeFile(resolve(root, "public/offline-routes.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.routeCount} offline routes.`);
