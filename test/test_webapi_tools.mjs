import { BrowserTool } from "../dist/browser.js";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.log("FAIL", n); } };

const mkStore = (obj) => ({ length: Object.keys(obj).length, key: i => Object.keys(obj)[i], getItem: k => obj[k] });
const mk = (root) => { const b = Object.create(BrowserTool.prototype); b.root = root; b.evlog = []; return b; };

const r1 = {
  defaultView: {
    localStorage: mkStore({ api_key: "xyz", note: "hello" }),
    sessionStorage: mkStore({ jwt: "aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbb.cccccccccc" }),
  },
  cookie: "sid=abc123def456ghi789",
};
const st = mk(r1).storageScan();
ok("storage returns an array", Array.isArray(st));
ok("storage returns store/name/value", st.every(x => "store" in x && "name" in x && "value" in x));
ok("storage captures api_key", st.some(x => x.name === "api_key"));
ok("storage captures jwt", st.some(x => x.name === "jwt"));
ok("storage captures note", st.some(x => x.name === "note" && x.value === "hello"));

ok("storage preserves the full value", st.find(x => x.name === "api_key").value === "xyz");

const ck = mk({ cookie: "sid=abc123def456ghi789; theme=dark" }).cookies();
ok("cookies returns an array", Array.isArray(ck));
ok("cookies split name and value", ck.length === 2 && ck[0].name === "sid" && ck[0].value.startsWith("abc123def456ghi789"));

const meta = (c) => ({ getAttribute: a => a === "http-equiv" ? "Content-Security-Policy" : (a === "content" ? c : null) });
const cspOk = mk({ querySelectorAll: () => [meta("script-src 'unsafe-inline'")] }).csp();
ok("csp returns {source, policy, reportOnly}", typeof cspOk === "object" && "source" in cspOk && "policy" in cspOk && "reportOnly" in cspOk);
ok("csp with meta -> source=meta", cspOk.source === "meta");
ok("csp preserves the raw policy", /unsafe-inline/.test(cspOk.policy));
const cspNone = mk({ querySelectorAll: () => [] }).csp();
ok("csp absent -> source=none", cspNone.source === "none");

const b = mk({}); b.evlog = [{ type: "postmessage", via: "https://other.example", msg: '{"cmd":"x"}' }];
const pm = b.postMessages();
ok("messages returns captured traffic", /postmessage\/https:\/\/other\.example/.test(pm));

ok("hookInitSource present", typeof BrowserTool.hookInitSource === "string" && BrowserTool.hookInitSource.length > 500);

for (const [label, root] of Object.entries({
  "root null": null,
  "no body": {},
  "querySelectorAll throws": { querySelectorAll: () => { throw new Error("dom"); }, cookie: "", body: {}, documentElement: {} },
})) {
  const bt = mk(root);
  const threw = [];
  for (const t of ["csp", "forms", "links", "sinks", "storage", "cookies", "iframes", "clobber"]) {
    try { await bt.toolset()[t]({}); } catch { threw.push(t); }
  }
  ok(`degenerate DOM (${label}) does not crash any tool`, threw.length === 0);
}

{
  const inputEl = { tagName: "INPUT", getAttribute: () => null };
  const form = { tagName: "FORM", name: inputEl, placeholder: inputEl, method: "post", textContent: " Pay now ",
    getAttribute: (k) => (k === "action" ? "/pay" : null) };
  const b = mk({ querySelectorAll: () => [form] });
  b.refs = new Map(); b.n = 0;
  if (!b.qsa) b.qsa = (s) => Array.from(b.root.querySelectorAll(s));
  let snap = null, err = null; try { snap = b.snapshot(); } catch (e) { err = e; }
  ok("snapshot does not throw when form.name is clobbered (" + (err && err.message) + ")", err === null);
  ok("snapshot uses text content when name/placeholder are elements", snap && snap.includes('"Pay now"'));
}
console.log(`WEBAPI: ${pass} pass ${fail} fail`);
process.exit(fail ? 1 : 0);
