# agent-browser-lite

In-page browser tools for agents: a compact `@eN` map of the page, actions on it, and structured
observations of what the page does at runtime. Zero dependencies.

## Install

```bash
npm install agent-browser-lite
```

## Quick start

```ts
import { BrowserTool } from "agent-browser-lite";

const bt = new BrowserTool(document, { realHost: "example.com" });
const tools = bt.toolset();          // { snapshot, click, fill, events, forms, … } — pass to your agent

tools.snapshot();
// @e1 input#q (text) "search"
// @e2 button "Go"
// @e3 a "Docs" -> /docs

tools.fill({ selector: "@e1", text: "hello" });   // selector: a CSS selector or an @eN ref
tools.click({ selector: "@e2" });
tools.events();                      // what the page did: requests, beacons, errors, DOM mutations
```

Works on a `Document` in the browser, including a same-origin `iframe`. The constructor installs
lightweight hooks (fetch, XHR, sendBeacon, errors, MutationObserver) so `events` has runtime data.
`realHost` keeps cross-origin accounting correct when the page is served through a same-origin proxy.

## Tools

| tool | returns |
|---|---|
| `snapshot` | interactive elements as `@eN` refs (the page map an agent acts on) |
| `source` · `scan` | raw HTML (bounded) · a region of the full source found by keyword/regex |
| `get` · `readHTML` | outerHTML / innerHTML and child count of a selector or `@eN` |
| `click` · `type` · `fill` | action results; `fill` dispatches `input` + `change` |
| `events` | runtime stream: fetch/xhr/beacon, resource and JS errors, `alert`, DOM mutations |
| `inspect` | `{forms, links, texts, hiddenTexts, comments, inlineScripts, localStorage}` |
| `storage` · `cookies` | `[{store, name, value}]` · `[{name, value}]` |
| `csp` | `{source, policy, reportOnly}` (`source: "none"` = no policy found in the page) |
| `resources` | `[{name, initiatorType, crossOrigin, isBeaconLike, duration, size}]` |
| `forms` | `[{action, method, hasPassword, hasCsrfToken, autocompleteOn}]` |
| `messages` | captured cross-frame `postMessage` traffic |
| `sinks` · `links` · `iframes` · `clobber` | DOM sinks with context · link targets · frames · global-name collisions |

Example outputs:

```js
forms()   → [{ index: 0, action: "http://x/login", method: "POST", hasPassword: true, hasCsrfToken: false, autocompleteOn: true }]
links()   → [{ href: "/docs", target: null, rel: null }]
storage() → [{ store: "localStorage", name: "theme", value: "dark" }]
csp()     → { source: "meta", policy: "default-src 'self'", reportOnly: false }
```

Every tool returns plain data, so the same toolset serves an agent, a test harness or any policy you
build on top.

## Acknowledgements

Inspired by [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) (Apache-2.0), a browser
automation CLI for AI agents. This package borrows its idea of compact `@eN` element references in page
snapshots, adapted to run inside the page with no dependencies.

## License

MIT
