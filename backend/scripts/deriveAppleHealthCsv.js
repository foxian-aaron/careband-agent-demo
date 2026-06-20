import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeAppleHealthXmlFile,
  snapshotsToCsv,
} from "../src/importers/appleHealthXml.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");
const privateDataRoot = path.join(projectRoot, "private_data");
const privateDerivedRoot = path.join(privateDataRoot, "derived");

const parseArgs = (argv) => {
  const [xmlPath, ...flags] = argv;
  const options = {
    elderId: "TEST001",
    limitDays: 14,
    stepSourceStrategy: process.env.APPLE_HEALTH_STEP_SOURCE_STRATEGY ?? "prefer_watch",
  };
  let outputPath = path.join(privateDerivedRoot, "apple_watch_daily_snapshots.csv");

  for (const flag of flags) {
    const [key, value] = flag.replace(/^--/, "").split("=");
    if (key === "elder-id") options.elderId = value;
    if (key === "start-date") options.startDate = value;
    if (key === "end-date") options.endDate = value;
    if (key === "limit-days") options.limitDays = value;
    if (key === "step-source-strategy") options.stepSourceStrategy = value;
    if (key === "output") outputPath = path.resolve(process.cwd(), value);
  }

  return { xmlPath, options, outputPath };
};

const { xmlPath, options, outputPath } = parseArgs(process.argv.slice(2));

if (!xmlPath) {
  console.error("Usage: npm run derive:apple-health -- <export.xml> [--limit-days=14]");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), xmlPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}
if (!resolvedPath.startsWith(`${privateDataRoot}${path.sep}`)) {
  console.warn("Privacy warning: Apple Health XML should stay under private_data/ and must not be committed.");
}
if (!outputPath.startsWith(`${privateDerivedRoot}${path.sep}`)) {
  console.warn("Privacy warning: derived Apple Health CSV should normally be written under private_data/derived/.");
}
const { snapshots, preview } = await analyzeAppleHealthXmlFile(resolvedPath, options);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, snapshotsToCsv(snapshots), "utf8");

console.log(JSON.stringify({
  output_path: outputPath,
  count: snapshots.length,
  date_range: {
    start: snapshots[0]?.date ?? null,
    end: snapshots[snapshots.length - 1]?.date ?? null,
  },
  step_source_strategy: preview.step_source_strategy,
  sleep_grouping_strategy: preview.sleep_grouping_strategy,
  warnings: preview.warnings,
}, null, 2));
