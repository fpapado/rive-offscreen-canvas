import { Rive } from "@rive-app/canvas-lite";

declare var self: DedicatedWorkerGlobalScope;

/**
 * A unique id for this canvas x this asset. Used to ensure that messages are
 * linked to the intended asset. Using the canvas as a key is not realistic,
 * because it is transferred, so it cannot be referenced from the main thread
 * for subsequent messages.
 */
type Id = string;

type InboundMessageBase =
  | { type: "cleanup" }
  | {
      type: "load";
      data: {
        // We are essentially mirroring the Rive API
        src: string;
        canvas: OffscreenCanvas;
        autoplay?: boolean;
        stateMachines?: string | string[] | undefined;
      };
    }
  | {
      type: "resizeDrawingSurfaceToCanvas";
      data: {
        devicePixelRatio: number;
        width: number;
        height: number;
      };
    };

export type MessageFromWorker = InboundMessageBase & { id: Id };

// TODO: These events could be made more ergonomic with a facade, that
// exposes an eventListener interface.
type OutboundMessageBase = { type: "load" };

export type MessageToWorker = OutboundMessageBase & { id: Id };

const riveInstances = new Map<Id, Rive>();

self.onmessage = (event: MessageEvent<MessageFromWorker>) => {
  const { id } = event.data;

  if (event.data.type === "load") {
    const { src, canvas, autoplay, stateMachines } = event.data.data;

    const riveInstance = new Rive({
      src,
      canvas,
      autoplay,
      stateMachines,
      onLoad: () => {
        self.postMessage({ id, type: "load" } satisfies MessageToWorker);
        // Ideally, we could do this, but there is no direct access to
        // HTMLCanvasElement, which rive-canvas expects. There might be a more
        // ergonomic way to attach these, e.g. via comlink.
        // riveInstance.resizeDrawingSurfaceToCanvas();
      },
    });

    riveInstances.set(id, riveInstance);
  }

  if (event.data.type === "resizeDrawingSurfaceToCanvas") {
    const instance = riveInstances.get(id);
    if (!instance) {
      console.warn(`No rive instance found for id ${id}`);
      return;
    }

    const { devicePixelRatio, width, height } = event.data.data;

    // @ts-expect-error -- We have not updated the types after patching
    instance.resizeDrawingSurfaceToCanvas(devicePixelRatio, width, height);
  }

  if (event.data.type === "cleanup") {
    const instance = riveInstances.get(id);
    if (!instance) {
      console.warn(`No rive instance found for id ${id}`);
      return;
    }
    instance.cleanup();
    riveInstances.delete(id);
  }
};
