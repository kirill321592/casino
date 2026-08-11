# Canvas startup performance

How the games get from a click in the lobby to a lit canvas, and why the code is
shaped the way it is. Read this before moving anything in `SlotsCanvas` or
`RouletteCanvas` back into the body of an effect.

## The problem

Picking a game from the lobby left an empty panel where the table should be for
several seconds. Three things stacked up:

1. **The scene was built synchronously inside `useEffect`.** React flushes
   passive effects *before* the browser paints, so the two-to-seven seconds of
   WebGL setup held back the paint of the whole page — header, controls, paytable
   and all — not just the canvas. Nothing was on screen to explain the wait.
2. **Nothing stood in for the canvas.** Even once the shell painted, the host
   `<div>` was an empty box until the first frame landed.
3. **The three.js chunk was only prefetched on hover.** 540 kB (135 kB gzipped)
   shared by both tables, so touch and keyboard players paid the full download
   after the click.

## Measurements

Taken against the dev server in the in-app browser, which runs a software GL
backend — the absolute numbers are inflated, the proportions are the point.

```js
// paste into the page console with the dev server running
const three = await import('/node_modules/three/build/three.module.js')
const reel = await import('/src/entities/slots/lib/reelScene.ts')
const renderer = new three.WebGLRenderer({ antialias: true, alpha: true })
reel.configureRenderer(renderer)
renderer.setSize(720, 500, false)

let t = performance.now()
const scene = reel.createSlotsScene(renderer, ['🍒', '🍋', '🔔'])
console.log('createScene', performance.now() - t)

t = performance.now()
await renderer.compileAsync(scene.scene, scene.camera)
console.log('compileAsync', performance.now() - t)

t = performance.now()
renderer.render(scene.scene, scene.camera)
console.log('firstFrame', performance.now() - t)
```

Warm driver, so the two columns are comparable. "After" is the median of four
runs — single samples on this backend swing by 700 ms, so treat anything under
that as noise:

| Phase                               | Before           | After              |
| ----------------------------------- | ---------------- | ------------------ |
| `createSlotsScene`                  | 337 ms           | 325 ms             |
| Shader link                         | (in first frame) | 624 ms, off-thread |
| First visible frame                 | 1929 ms          | 922 ms             |
| **Blocking the page's first paint** | **~2.3 s**       | **0 ms**           |

Effectively all of the first-frame gain is `compileAsync`. Before the change the
implicit `compile()` returned in 57 ms without waiting for the driver to finish
linking, so the stall simply moved into the first `render()`.

On a genuinely cold context — the first WebGL surface the page has ever created —
`createSlotsScene` measured 2967 ms and the first frame 4482 ms, for ~7.5 s of
blocked paint. Driver and context initialisation is most of that gap, and none of
it is work this change removes. What changed is that it no longer happens in
front of the paint.

Two things that turned out **not** to matter, so nobody re-optimises them:

- Drawing the strip canvases, emoji `fillText` and all, costs ~18 ms for all
  six. It is not worth caching, shrinking or moving to a worker.
- The PMREM room environment costs ~230 ms. Real, but a fraction of the total.

The cost was **shader linking and texture upload**, both of which happen on the
first `render()` unless you ask for them earlier.

## What changed

### Build the scene after the first paint

[`src/shared/lib/schedule.ts`](../src/shared/lib/schedule.ts) adds `afterPaint()`
— a double `requestAnimationFrame`, because the first frame's callback still runs
*before* that frame is painted; only the one queued from inside it lands on the
other side. Both canvases wrap their setup in it, so the page shell paints
immediately and the canvas is the only thing outstanding.

`whenIdle()` in the same file wraps `requestIdleCallback` with a `setTimeout`
fallback.

### Stand something in the canvas's place

[`CanvasPlaceholder`](../src/shared/ui/CanvasPlaceholder/CanvasPlaceholder.tsx)
fills the exact footprint with the silhouette the player is waiting for — a reel
window for slots, concentric rings for roulette. The host carries `aria-busy`,
the label is a `role="status"` live region, and the shimmer animates opacity only
(so it stays on the compositor while the main thread is busy with the very work
it is covering for) and drops out under `prefers-reduced-motion`.

The canvas fades in when the first frame is ready. The host div is a sibling of
the placeholder, never its parent — three.js appends the canvas imperatively, and
React must not be managing children of the same element.

### Link shaders off the main thread

`await renderer.compileAsync(scene, camera)` before the canvas is appended.
Where `KHR_parallel_shader_compile` is available (Chrome, Edge, most Android) the
driver links on its own thread and three polls per frame, so the placeholder
keeps animating. Where it is not, this costs nothing over the old behaviour.

### Prefetch both tables from the lobby

[`App.tsx`](../src/app/App.tsx) fetches both game chunks once the lobby has been
idle for 1.5 s, so the click has nothing left to download. Skipped when
`navigator.connection.saveData` is set — between them the tables are most of the
app's JavaScript, and that is not a bill to run up on someone's behalf.
`HomePage` also preloads on `pointerdown`, since touch never hovers.

## Things to know

- **`afterPaint` does not fire in a hidden tab**, because `requestAnimationFrame`
  does not. A game opened in a background tab builds its scene when the tab is
  first looked at. This is the behaviour we want; it is not a bug to fix.
- **`ResizeObserver` is attached after `compileAsync` resolves.** Safe, because
  `observe()` fires an initial callback with the current size, which catches any
  resize during the build.
- **Unmounting mid-build is handled by a `cancelled` flag and a `cleanups`
  array.** Each stage pushes its own teardown as it completes, and cleanup runs
  them in reverse — so a scene abandoned during `compileAsync` is disposed rather
  than leaked, without the cleanup needing to know how far the build got.
- Under `StrictMode` the effect runs twice in dev, but the first pass is
  cancelled before its `afterPaint` ever fires — so dev no longer builds and
  throws away an entire WebGL scene on every mount.

## Left on the table

- **Deferring the motion-blur strips.** Half the first frame's texture upload is
  blur strips nothing looks at until a reel turns, so building them at idle
  instead looks like an easy win. It was written, measured, and reverted: with
  `compileAsync` already in place it made **no measurable difference** — 922 ms
  median for the first frame with the strips built eagerly, against 1027 ms with
  them deferred, i.e. inside the run-to-run noise. Texture upload was never the
  bottleneck; waiting for the shader link was. The version that was removed
  needed a lazy builder per reel, an idempotence flag, a hidden mesh, a safety
  net in `animateReels`, and a redraw after preparing, with the cost silently
  returning as a first-spin hitch if that redraw were ever tidied away. Do not
  re-add it without measuring first.
- The 540 kB shared chunk is emitted as `ResultOverlay-*.js`, named after
  whichever module happened to anchor it. Cosmetic, but confusing in a network
  panel; a `manualChunks` entry naming it `three` would fix it.
- Both games build their own PMREM environment (~230 ms each). It cannot be
  shared across renderers, and each game mount makes a new one, so returning to
  the lobby and back pays it again.
- `MeshPhysicalMaterial` with `clearcoat` on the cabinet and wheel trim is the
  most expensive program in either scene. Dropping to `MeshStandardMaterial`
  would link faster and look worse; not worth it without a reason.
