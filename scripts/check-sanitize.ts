import { cleanText, safeHttpUrl, slugify, domainOf } from "../src/lib/sanitize";

const cases: [string, string, string][] = [
  ["script body", "<script>alert(1)</script>Hello", "Hello"],
  ["encoded tag", "&lt;img src=x onerror=alert(1)&gt;Safe", "Safe"],
  ["entities", "A &amp; B &mdash; C", "A & B — C"],
  ["whitespace", "  many   spaces  ", "many spaces"],
];

let failed = 0;
for (const [name, input, expected] of cases) {
  const got = cleanText(input);
  if (got === expected) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(expected)}`); }
}

// Zero-width and bidi characters must not survive into a rendered title.
const sneaky = "Spaced" + String.fromCharCode(0x200b) + "out" + String.fromCharCode(0x202e) + "text";
const cleaned = cleanText(sneaky);
if (/[​‮]/.test(cleaned)) { failed++; console.log("FAIL  zero-width/bidi survived:", JSON.stringify(cleaned)); }
else console.log("PASS  zero-width/bidi stripped ->", JSON.stringify(cleaned));

const urlChecks: [string, boolean][] = [
  ["javascript:alert(1)", false],
  ["data:text/html,<h1>x", false],
  ["https://example.com/a?b=1", true],
  ["http://example.com", true],
  ["notaurl", false],
];
for (const [input, shouldPass] of urlChecks) {
  const got = safeHttpUrl(input);
  const ok = shouldPass ? got !== null : got === null;
  if (!ok) { failed++; console.log(`FAIL  url ${input} -> ${got}`); }
  else console.log(`PASS  url ${input} -> ${got ?? "rejected"}`);
}

console.log("slug about ->", slugify("about"));
console.log("slug Fly.io ->", slugify("Fly.io"));
console.log("domain ->", domainOf("https://www.Supabase.com/x"));
console.log("truncated length ->", cleanText("x".repeat(400), 50).length);

if (failed) { console.error(`\n${failed} failing check(s)`); process.exit(1); }
console.log("\nall sanitiser checks passed");
