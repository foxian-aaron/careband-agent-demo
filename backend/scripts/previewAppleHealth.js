import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAppleHealthXmlFile } from "../src/importers/appleHealthXml.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const privateDataRoot = path.join(projectRoot, "private_data");

const parseArgs = (argv) => {
  const [xmlPath, ...flags] = argv;
  const options = { elderId: "TEST001", stepSourceStrategy: process.env.APPLE_HEALTH_STEP_SOURCE_STRATEGY ?? "prefer_watch" };
  for (const flag of flags) {
    const [key, value] = flag.replace(/^--/, "").split("=");
    if (key === "elder-id") options.elderId = value;
    if (key === "start-date") options.startDate = value;
    if (key === "end-date") options.endDate = value;
    if (key === "limit-days") options.limitDays = value;
    if (key === "step-source-strategy") options.stepSourceStrategy = value;
  }
  return { xmlPath, options };
};

const { xmlPath, options } = parseArgs(process.argv.slice(2));

if (!xmlPath) {
  console.error("Usage: npm run preview:apple-health -- <export.xml> [--limit-days=14]");
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
const { preview } = await analyzeAppleHealthXmlFile(resolvedPath, options);

console.log(JSON.stringify(preview, null, 2));
