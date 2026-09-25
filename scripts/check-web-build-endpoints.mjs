import {
  readdir,
  readFile
} from "node:fs/promises";
import path from "node:path";

/*
 * Fails the build when the built web bundle calls a loopback API. The
 * syntrack.io bundle deployed 2026-09-21 was built without VITE_API_URL
 * and shipped http://localhost:4000/api, so every browser-side call -
 * including the desktop connect page a Microsoft Store tester lands on -
 * failed for every visitor. Only the bundle that actually ships counts.
 *
 * SYNTRACK_ALLOW_LOCAL_WEB_BUILD=1 skips this for an intentional
 * local-only build.
 */

const assetsDir = path.resolve("apps/web/dist/assets");

const loopbackApiPattern =
  /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/api/gu;

if (process.env.SYNTRACK_ALLOW_LOCAL_WEB_BUILD === "1") {
  console.warn(
    "check-web-build-endpoints: skipped (SYNTRACK_ALLOW_LOCAL_WEB_BUILD=1) - never deploy this build."
  );
  process.exit(0);
}

const files = (await readdir(assetsDir))
  .filter((name) => name.endsWith(".js"));

if (files.length === 0) {
  console.error(`check-web-build-endpoints: no built JS found in ${assetsDir}`);
  process.exit(1);
}

const hits = [];

for (const name of files) {
  const source = await readFile(path.join(assetsDir, name), "utf8");

  for (const match of source.matchAll(loopbackApiPattern)) {
    hits.push(`${name}: ${match[0]}`);
  }
}

if (hits.length > 0) {
  console.error(
    "check-web-build-endpoints: FAIL - the web bundle calls a loopback API:"
  );
  for (const hit of hits) {
    console.error(`  ${hit}`);
  }
  console.error(
    "Unset VITE_API_URL (same-origin /api) or set it to the https production API before building for deployment."
  );
  process.exit(1);
}

console.log(
  `check-web-build-endpoints: PASS (${files.length} bundle file(s), no loopback API)`
);
