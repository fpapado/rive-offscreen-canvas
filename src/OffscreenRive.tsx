import {
  RefCallback,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { Message } from "./riveWorker/riveWorker";

const riveWorker = new Worker(
  new URL("./riveWorker/riveWorker", import.meta.url),
  {
    type: "module",
  }
);

const STATE_MACHINE_NAME = "Motion";
const url = "/animations/6pCQ-clean-the-car.riv";

export function OffscreenRive() {
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
          src: url,
          autoplay: true,
          stateMachines: STATE_MACHINE_NAME,
        },
      } satisfies Message,
      { transfer: [offscreenCanvas] }
    );

    return () => {
      riveWorker.postMessage({ type: "dispose", id });
    };
  }, [offscreenCanvas]);

  // TODO: @rive-app/react-canvas does a few neat things with resizing the
  // canvas; we can probably mirror them here (modulo some effect/ref quirks in
  // the original source)
  return <canvas ref={setCanvasRef} width="400" height="400"></canvas>;
}
