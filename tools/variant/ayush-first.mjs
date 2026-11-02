// Builds the "Ayush & Mahi" edition of the invitation (ayush-mahi.vercel.app)
// from the same code: the groom's name and family come first everywhere.
// It edits the files in place, so it runs only as the Vercel build command
// of that project (node tools/variant/ayush-first.mjs); the main site
// (mahi-ayush.vercel.app) has no build step and is never touched by it.
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://ayush-mahi.vercel.app/";
const edit = (file, fn) => {
  const before = readFileSync(file, "utf8");
  const after = fn(before);
  if (after === before) throw new Error(`Nothing changed in ${file}`);
  writeFileSync(file, after);
};
const names = (s) =>
  s
    .replaceAll("Mahi &amp; Ayush", "Ayush &amp; Mahi")
    .replaceAll("Mahi & Ayush", "Ayush & Mahi")
    .replaceAll("Mahi and Ayush", "Ayush and Mahi");
const swapLines = (s, a, b) => {
  const ma = s.match(a);
  const mb = s.match(b);
  if (!ma || !mb) throw new Error(`Lines not found: ${a} / ${b}`);
  return s.replace(ma[0], "\u0000A").replace(mb[0], ma[0]).replace("\u0000A", mb[0]);
};

edit("js/config.js", (s) => {
  // The groom becomes partnerOne: swap the two people, keep the keys.
  const one = s.match(/    partnerOne: (\{[^\n]*\}),/);
  const two = s.match(/    partnerTwo: (\{[^\n]*\}),/);
  if (!one || !two) throw new Error("Couple not found in config");
  s = s.replace(one[0], `    partnerOne: ${two[1]},`).replace(two[0], `    partnerTwo: ${one[1]},`);
  s = swapLines(s, /      \{ side: "Bride's Family"[^\n]*\},/, /      \{ side: "Groom's Family"[^\n]*\},/);
  s = s.replace(/siteUrl: "[^"]*"/, `siteUrl: "${SITE}"`);
  return names(s);
});

edit("index.html", (s) => names(s)
    // The no-script text lists the families too: groom's first.
    .replace(/(Together with their families<br \/>)([^<]*Jagetiya[^<]*)<br \/>([^<]*Porwal[^<]*)</, "$1$3<br />$2<").replaceAll("https://mahi-ayush.vercel.app/", SITE).replace("assets/images/share-card.jpg", "assets/images/share-card-ayush-mahi.jpg"));

console.log("Ayush & Mahi edition ready.");
