const fs = require("fs");
const bt = "\u0060";
const src = fs.readFileSync("src/app/api/setup/route.ts", "utf8");
const lines = src.split("\n");
let inArray = false;
let result = "";
for (const line of lines) {
  if (line.includes("const CREATE_TABLES = [")) { inArray = true; continue; }
  if (inArray && line.trim() === "]") break;
  if (!inArray) continue;
  let s = line;
  s = s.replace(/^\s+/, "");
  if (s.startsWith(bt)) s = s.slice(1);
  if (s.endsWith(",") && s.slice(-2, -1) === bt) s = s.slice(0, -2) + ";";
  else if (s.endsWith(bt)) s = s.slice(0, -1) + ";";
  s = s.replace(new RegExp("\\\\" + bt, "g"), bt);
  if (s.trim()) result += s + "\n";
}
fs.writeFileSync("schema_complet.sql", result);
console.log("OK");
