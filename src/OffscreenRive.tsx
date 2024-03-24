import {
  RefCallback,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { Message } from "./riveWorker/riveWorker";
import type { RiveProps } from "@rive-app/react-canvas-lite";

// This is the standard method of initialising a worker, and also the syntax
// that Vite understands. Note that a single worker is created here; the
// assumption is that Rive is fast enough to run multiple animations off a
// single worker. You might decide to do pooling, or something else. Refer to
// the README for more information.
const riveWorker = new Worker(
  new URL("./riveWorker/riveWorker", import.meta.url),
  {
    // Technically optional (Vite will transpile `import` to `importScripts`),
    // but left here to be explicit
    type: "module",
  }
);

type Props = Pick<RiveProps, "src" | "stateMachines">;

export function OffscreenRive({ src, stateMachines }: Props) {
  const id = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>();
  const [offscreenCanvas, setOffscreenCanvas] = useState<OffscreenCanvas>();

  const setCanvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (element) => {
      if (!element) {
        canvasRef.current = element;
        return;
      }
      if (element !== canvasRef.current) {
        // A canvas can only be transferred once, so we keep track of the canvas
        // changing here
        let offscreenCanvas: OffscreenCanvas;
        try {
          offscreenCanvas = element.transferControlToOffscreen();
          setOffscreenCanvas(offscreenCanvas);
        } catch (err) {
          console.log("Could not transfer canvas offscreen", err);
        }
        canvasRef.current = element;
      }
    },
    []
  );

  useEffect(() => {
    if (!offscreenCanvas) {
      return;
    }

    riveWorker.postMessage(
      {
        type: "load",
        id,
        data: {
          canvas: offscreenCanvas,
          src,
          stateMachines,
          autoplay: true,
        },
      } satisfies Message,
      { transfer: [offscreenCanvas] }
    );

    return () => {
      riveWorker.postMessage({ type: "cleanup", id } satisfies Message);
    };
  }, [offscreenCanvas]);

  // TODO: @rive-app/react-canvas does a few neat things with resizing the
  // canvas; we can probably mirror them here.
  return <canvas ref={setCanvasRef} width="400" height="400"></canvas>;
}
