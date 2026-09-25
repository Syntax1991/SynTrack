import { spawnSync } from "node:child_process";

/*
 * The only supported way to build the web app for deployment.
 *
 * A developer's apps/web/.env points VITE_API_URL at the local API
 * (http://localhost:4000/api). A plain `npm run build` from such a
 * checkout bakes that into the bundle - which is exactly how the
 * syntrack.io bundle deployed 2026-09-21 broke every browser-side API
 * call. Vite lets process.env override .env files, so this build pins
 * VITE_API_URL to SYNTRACK_PRODUCTION_API_URL (default: empty =
 * same-origin /api) and then scans the output.
 */

const productionApiUrl =
  process.env.SYNTRACK_PRODUCTION_API_URL ?? "";

const env = {
  ...process.env,
  VITE_API_URL: productionApiUrl
};

delete env.SYNTRACK_ALLOW_LOCAL_WEB_BUILD;

function run(command) {
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
    env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  `build-web-production: VITE_API_URL=${productionApiUrl || "<same-origin /api>"}`
);

run("npm run build --workspace syntrack-web");
run("node scripts/check-web-build-endpoints.mjs");
