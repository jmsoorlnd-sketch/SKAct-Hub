const fs = require("fs");
const path = require("path");
const root = path.join(process.cwd(), "frontend", "src");
const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      walk(full);
    } else if (exts.has(path.extname(name.name))) {
      files.push(full);
    }
  }
}
walk(root);
let changedCount = 0;
let fileCount = 0;
for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;

  text = text.replace(
    /const\s+API_BASE\s*=\s*["']http:\/\/localhost:5000\/api["'];/g,
    "const API_BASE = window.API_BASE;",
  );

  text = text.replace(
    /(["'`])http:\/\/localhost:5000\/api([^"'`]*)\1/g,
    (_, quote, rest) => {
      return `\`${quote === "`" ? "" : ""}\${window.API_BASE}${rest}\``;
    },
  );

  text = text.replace(
    /(["'`])http:\/\/localhost:5000([^"'`]*)\1/g,
    (_, quote, rest) => {
      return `\`${quote === "`" ? "" : ""}\${window.BACKEND_URL}${rest}\``;
    },
  );

  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    changedCount += 1;
  }
  fileCount += 1;
}
console.log(`Processed ${fileCount} files, modified ${changedCount} files.`);
