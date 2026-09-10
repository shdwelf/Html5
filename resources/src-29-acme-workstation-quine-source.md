# ACME Cryptographic Workstation — Quine Source Package

> **Register:** src-29 · **Original:** https://bashupload.app/uqrop7.htm
> **Extracted:** 30 August 2026 · **Type:** self-published source listing (quine package)

The quine source package for the ACME Cryptographic Workstation — a page that renders
its own multi-file source. Extracted file manifest:

| Path | Language | Size |
|---|---|---|
| (app source files, HTML) | html | 350 B+ |
| `package.json` | json | 391 B |

**package.json dependencies (as published):**
```json
{
  "name": "react-vite-tailwind",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "clsx": "2.1.1",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "tailwind-merge": "3.4.0",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.1.17",
    "typescript": "5.9.3",
    "vite": "7.3.2",
    "tailwindcss": "4.1.17"
  }
}
```
The package renders each file with escaped source into the `#files` container —
the workstation publishing itself as a quine.
