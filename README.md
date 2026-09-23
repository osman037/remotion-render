# 🎬 Remotion 4K Render Pipeline — GitHub Actions

> Upload `composition.tsx` → GitHub renders 4K 60fps → Download MP4.  
> Zero local setup needed after first-time repo creation.

---

## 📁 Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── render.yml          ← The render pipeline (DO NOT EDIT)
├── src/
│   ├── index.ts                ← Remotion entry point (DO NOT EDIT)
│   ├── Root.tsx                ← Composition registry (DO NOT EDIT)
│   └── composition.tsx         ← ✅ YOUR FILE — replace this to render
├── remotion.config.ts          ← Render settings (DO NOT EDIT)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 One-Time Setup (5 minutes)

### Step 1 — Fork or create repository

1. Go to **github.com** → **New repository**
2. Name it `remotion-render` (or anything you like)
3. Set to **Private** (your compositions stay private)
4. Click **Create repository**

### Step 2 — Upload all these files

Upload the entire folder structure above via:
- **GitHub web UI** → "Add file" → "Upload files" (drag the whole folder)
- **OR** use GitHub Desktop
- **OR** via git CLI:

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/remotion-render.git
git add .
git commit -m "Initial render pipeline setup"
git push -u origin main
```

### Step 3 — That's it. Done.

The first push will trigger a render automatically. ✅

---

## 🔄 How to Render a New Composition

### Method A — Replace via GitHub web UI (easiest, no git needed)

1. Go to your repo on **github.com**
2. Click `src/` → `composition.tsx`
3. Click the **pencil icon** (Edit)
4. Select all → Paste your new `.tsx` content
5. Scroll down → Click **"Commit changes"**
6. ✅ Render starts automatically!

### Method B — Upload via git

```bash
# Copy your new composition file
cp /path/to/YourNewComposition.tsx src/composition.tsx

# Commit and push
git add src/composition.tsx
git commit -m "New composition: YourNewComposition"
git push
```

### Method C — Trigger manually without changing any file

1. Go to **Actions** tab in your repo
2. Click **"🎬 Render Remotion Video"** in the left sidebar
3. Click **"Run workflow"** (top right)
4. Optionally change the Composition ID
5. Click **"Run workflow"** green button

---

## ⬇️ How to Download Your Rendered Video

After the workflow finishes (green checkmark):

1. Go to **Actions** tab
2. Click the latest **"🎬 Render Remotion Video"** run
3. Scroll to the bottom of the run page
4. Under **"Artifacts"** — click your artifact name
5. A `.zip` file downloads — unzip it to get your `.mp4`

> **Videos are kept for 90 days** then auto-deleted by GitHub.

---

## ⚙️ Render Specs (Locked)

| Setting | Value |
|---|---|
| Resolution | 3840 × 2160 (4K UHD) |
| Frame rate | 60 fps |
| Duration | 15 seconds (900 frames) |
| Codec | H.264 |
| Quality | CRF 18 (near-lossless) |
| Pixel format | yuv420p (universal compatibility) |
| Render time | ~20–60 min on GitHub's free runners |

---

## ⚠️ Rules for Your `composition.tsx`

Your file **must**:

1. Export a named component: `export const CybersecurityNetworkMap: React.FC = () => { ... }`  
   *(or whatever name — but update `Root.tsx` and the workflow's `composition_id` to match)*
2. Use `useCurrentFrame()` and `useVideoConfig()` from `remotion`
3. Have **no external fetch calls** or browser-only APIs (no `localStorage`, no `window.fetch` to other sites)
4. Not import packages outside of `react`, `react-dom`, and `remotion`  
   *(if you need extra packages, add them to `package.json` `dependencies` first)*

---

## 🛠️ Changing the Composition ID

If your component is named differently (e.g. `ParticleField`):

**1. In `src/Root.tsx`** — change the import and the `id`:
```tsx
import { ParticleField } from "./composition";
// ...
<Composition id="ParticleField" component={ParticleField} ... />
```

**2. When triggering manually** — enter `ParticleField` in the workflow input box.

**3. On push** — change the default in `render.yml` line:
```yaml
default: 'ParticleField'
```

---

## 💡 Tips

- **Render time** depends on composition complexity. Simple compositions: ~20 min. Heavy ones: ~60 min.
- GitHub Actions gives you **2,000 free minutes/month** on private repos (free plan).
- A 15s 4K H.264 CRF-18 file is typically **200 MB – 1 GB** depending on motion complexity.
- If render times out (>120 min), reduce `--concurrency` to `2` in `render.yml`.
