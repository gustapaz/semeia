import fs from "node:fs";
const pkg = JSON.parse(
  fs.readFileSync("node_modules/mithril/package.json", "utf8"),
);
const name = fs
  .readdirSync("node_modules/mithril")
  .find((n) => /^license(\.md|\.txt)?$/i.test(n));
if (!name) throw new Error("Mithril license missing");
const license = fs
  .readFileSync(`node_modules/mithril/${name}`, "utf8")
  .replaceAll("\r\n", "\n")
  .trimEnd();
fs.writeFileSync(
  "public/third-party.txt",
  `Mithril.js ${pkg.version}\n\n${license}\n`,
);
