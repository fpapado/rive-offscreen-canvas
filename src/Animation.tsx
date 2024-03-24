import { useRive } from "@rive-app/react-canvas-lite";

const STATE_MACHINE_NAME = "Motion";

export function Animation() {
  const { RiveComponent } = useRive({
    src: "/animations/6pCQ-clean-the-car.riv",
    autoplay: true,
    stateMachines: STATE_MACHINE_NAME,
  });

  return <RiveComponent style={{ width: "400px", height: "400px" }} />;
}
