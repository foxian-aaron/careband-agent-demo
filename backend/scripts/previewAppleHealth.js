import fs from "node:fs";
import path from "node:path";
import { analyzeAppleHealthXmlFile } from "../src/importers/appleHealthXml.js";

const parseArgs = (argv) => {
  const [xmlPath, ...flags] = argv;
  const options = { elderId: "TEST001" };
  for (const flag of flags) {
    const [key, value] = flag.replace(/^--/, "").split("=");
    if (key === "elder-id") options.elderId = value;
    if (key === "start-date") options.startDate = value;
    if (key === "end-date") options.endDate = value;
    if (key === "limit-days") options.limitDays = value;
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
const { preview } = await analyzeAppleHealthXmlFile(resolvedPath, options);

console.log(JSON.stringify(preview, null, 2));
