# Rive with OffscreenCanvas

This is a demo/proof of concept of using Rive backed by an [OffScreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).
This allows animations to proceed without jank, even if the main thread ends up being blocked.

## Running this demo

You will need node and pnpm.

```shell
# Install dependencies
pnpm install

# Start the dev server
pnpm start
```

## What problem does this solve?

Rive is already very performant on the main thread, and its usage of `canvas` (compared to `svg`) means that much work can happen without taxing the DOM.

If the usage of the event loop is well-optimised, then Rive-backed animations can proceed happily, without the more complicated setup that this demo shows.

However, contemporary frontend applications are still largely on the main thread. This means that, during heavy operations, Rive-backed animations can stutter.
An alternative to this problem, is moving Rive-backed animations off the main thread, so they can keep running in the usual performant way.

## The core idea

As mentioned, Rive renders on a `canvas`, backed either by a `CanvasRenderingContext2D`, `WebGLRenderingContext`, `WebGL2RenderingContext`.

A canvas can be transferred off the main thread via [HTMLCanvasElement.transferControlToOffscreen](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen), where the usual context operations can be performed.

Rive can be used within a web worker, with custom messaging to receive a canvas from the main thread, and operate on it.

This setup can be wrapped in a React component, or anything else that might be framework-specific.

In this case, the demo uses React, and tracks some of the API surface from `@rive-app/canvas` and `@rive-app/react-canvas`.
The main relevant components are `OffscreenRive` and `riveWorker`.
The worker loading is handled via [Vite's web worker feature](https://v3.vitejs.dev/guide/features.html#web-workers), but similar solutions exists for other bundlers and frameworks (or even natively).

## Open issues / questions

### Source issues

While Rive's types accept `canvas: HTMLCanvasElement | OffscreenCanvas`, the implementation does occasionally reach out to either `document`, `document.createElement`, or comparisons to `instanceof HTMLCanvasElement`.
These features are not available a worker scope, meaning that they will throw in most cases.

The `patches` directory contains some [pnpm-backed patches](https://pnpm.io/cli/patch) related to all this.

Some relevant parts:

#### Mesh feature-detection via `document.createElement`

If a mesh is used, then Rive feature-detects support for some features by creating an `HTMLCanvasElement`. This can be avoided by doing feature detection on `OffscreenCanvas` instead, or doing it conditionally.

#### `resizeDrawingSurfaceToCanvas()` and canvas DOM access

Rive's [resizeDrawingSurfaceToCanvas()](https://help.rive.app/runtimes/overview/web-js/rive-parameters#resizedrawingsurfacetocanvas) uses an `instanceof HTMLCanvasElement` comparison and `this.canvas.getBoundingClientRect()`, neither of which exist in workers or on `OffscreenCanvas`.

This method is recommended to be called in the `onLoad` callback, to avoid blurry images on high-dpi screens, and might be called automatically in future Rive versions.

At the moment, there is the `customDevicePixelRatio` option, but Rive needs to also reed the canvas `width` and `height`.

To solve this, `resizeDrawingSurfaceToCanvas` could take a callback, to defer to the caller for how to figure out the device pixel ratio, as well as width and height.
It could alternatively take `width` and `weight` as parameters in addition to `customDevicePixelRatio`, and skip the auto-detection if those are specified.

This approach seems compatible with this note from the Rive docs:

> In a future major version of this runtime, this API may be called internally on initialization by default, with an option to opt-out if you have specific width and height properties you want to set on the canvas

### Other document access (e.g. attaching event listeners)

There is no standard way to attach listeners to the DOM/main thread `canvas`, from a web worker.
A general solution would have to account for this, and either provide such a way by default (e.g. by proxying), provide an extension point (e.g. an open-ended `onAddEventListener` to defer attachment to the user) or to exclude these use-cases as out of scope.

### Working with web workers

At the moment, the demo `OffscreenRive` uses a single `riveWorker`, which tracks Rive instances based on an id.

The assumption here is that Rive is performant enough to run many instances on the same worker without blocking each other, and that the main issue is the main thread being overworked due to unrelated reasons.

If this assumption does not hold, then some worker pooling method could help scale this approach (at the cost of additional complexity).

### Distribution

At the moment, this is just an inline demo, and is not distributed as a library.
It can be used as a reference for your own explorations.

While making a framework- and use-case specific library would be workable (modulo some source issues above), I have the gut feeling that there is an intermediate, framework-agnostic layer missing.

This imaginary layer could be `*-canvas-worker`, and would provide a stable API for communicating via `OffscreenCanvas` and a Rive-in-web-worker instance.
This layer might use [`comlink`](https://github.com/GoogleChromeLabs/comlink), or some other [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) facade, to make it a bit nicer to work with.
This layer might even tackle other issues, such as worker pooling, in a general way.

Having this layer distributed by Rive would mean that the API surface is tracked as part of regular Rive updates.
Making a truly generic library that tracks an external API surface is hard work!

To the best of my understanding, distributing libraries with web workers is a bit annoying, because of all the different ways of setting them up and consuming them.
Such a library would require extensive documentation, or concrete references for how to use web workers in popular frameworks.
This task would be similar to the task of distributing a Wasm library, which Rive already tackles well :)
