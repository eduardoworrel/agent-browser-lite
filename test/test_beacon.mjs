const re = /\/(collect|track|beacon|log|pixel|telemetry|analytics)s?([/?&#]|$)/i;
const cases = [
  ["/logo.png", false], ["/login", false], ["/catalog", false], ["/analytics.js", false], ["/api/ping", false],
  ["/log?x=1", true], ["/logs", true], ["/track?u=", true], ["/collect", true], ["/analytics?e=1", true],
  ["https://collect.cdn.example/track?u=c", true],
];
let fail = 0;
for (const [url, expected] of cases) { const got = re.test(url); if (got !== expected) { fail++; console.log(`FAIL ${url} -> ${got} (expected ${expected})`); } }
if (fail) { console.log(`test_beacon_like FAIL (${fail})`); process.exit(1); }
console.log(`test_beacon_like OK (${cases.length})`);
