import "./App.css";
import RiveAnimation from "@rive-app/react-canvas-lite";
import { OffscreenRive } from "./OffscreenRive.tsx";
import { BlockMainThreadButton } from "./BlockMainThreadButton.tsx";

const stateMachineName = "Motion";
const src = "/animations/6pCQ-clean-the-car.riv";

function App() {
  return (
    <div>
      <div className="grid">
        <div>
          <h2>Main thread</h2>
          <RiveAnimation
            src={src}
            stateMachines={stateMachineName}
            style={{
              width: 400,
              height: 400,
            }}
          />
        </div>
        <div>
          <h2>Worker with OffscreenCanvas</h2>
          <OffscreenRive
            src={src}
            stateMachines={stateMachineName}
            style={{
              width: 400,
              height: 400,
            }}
          />
        </div>
      </div>
      <p className="attribution">
        <a href="https://rive.app/community/2732-5606-clean-the-car/">
          Source: Clean the Car, by JcToon
        </a>
      </p>
      <BlockMainThreadButton />
    </div>
  );
}

export default App;
