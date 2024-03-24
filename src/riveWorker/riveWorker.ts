import { Rive } from "@rive-app/canvas-lite";

declare var self: DedicatedWorkerGlobalScope;

/**
 * A unique id for this canvas x this asset. Used to ensure that messages are
 * linked to the intended asset. Using the canvas as a key is not realistic,
 * because it is transferred, so it cannot be referenced from the main thread
 * for subsequent messages.
 */
type Id = string;

type MessageBase =
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
    };

export type Message = MessageBase & { id: Id };

const riveInstances = new Map<Id, Rive>();

self.onmessage = (event: MessageEvent<Message>) => {
  const { id } = event.data;

  if (event.data.type === "load") {
    const { src, canvas, autoplay, stateMachines } = event.data.data;

    const riveInstance = new Rive({
      src,
      canvas,
      autoplay,
      stateMachines,
      onLoad: () => {
        // Ideally, we could do this, but there is no direct access to
        // HTMLCanvasElement, which rive-canvas expects. Maybe there should be a
        // way to Proxy the access (e.g. via comlink)
        // riveInstance.resizeDrawingSurfaceToCanvas();

        // Another option:
        console.log(canvas.width, canvas.height);
      },
    });

    riveInstances.set(id, riveInstance);
  }

  if (event.data.type === "cleanup") {
    console.log("cleanup");
    const instance = riveInstances.get(id);
    if (!instance) {
      console.warn(`No rive instance found for id ${id}`);
      return;
    }
    instance.cleanup();
    riveInstances.delete(id);
  }
};
