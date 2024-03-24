import type { RiveProps } from "@rive-app/react-canvas-lite";
import {
  type ComponentProps,
  type RefCallback,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  MessageFromWorker,
  MessageToWorker,
} from "./riveWorker/riveWorker";

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

export function OffscreenRive({
  src,
  stateMachines,
  style,
  ...rest
}: Props & ComponentProps<"canvas">) {
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
          console.error("Could not transfer canvas offscreen", err);
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
      } satisfies MessageFromWorker,
      { transfer: [offscreenCanvas] }
    );

    riveWorker.addEventListener(
      "message",
      (ev: MessageEvent<MessageToWorker>) => {
        if (ev.data.type === "load") {
          riveWorker.postMessage({
            type: "resizeDrawingSurfaceToCanvas",
            id,
            data: structuredClone({
              devicePixelRatio: window.devicePixelRatio,
              width: canvasRef.current?.width!,
              height: canvasRef.current?.height!,
            }),
          } satisfies MessageFromWorker);
        }
      }
    );

    return () => {
      riveWorker.postMessage({
        type: "cleanup",
        id,
      } satisfies MessageFromWorker);
    };
  }, [offscreenCanvas]);

  return (
    <div style={style}>
      <canvas
        ref={setCanvasRef}
        // Cheating a bit, and hardcoding these for demonstration purposes
        // TODO: @rive-app/react-canvas does a few neat things with resizing the
        // canvas; we can probably mirror them here.
        width="400"
        height="400"
        style={{
          width: 400,
          height: 400,
        }}
        {...rest}
      ></canvas>
    </div>
  );
}
