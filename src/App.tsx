import "./App.css";
import { Animation } from "./Animation.tsx";
import { OffscreenRive } from "./OffscreenRive.tsx";
import { BlockMainThreadButton } from "./BlockMainThreadButton.tsx";

function App() {
  return (
    <div>
      <div className="grid">
        <div>
          <h2>Main thread</h2>
          <Animation />
        </div>
        <div>
          <h2>Worker with OffscreenCanvas</h2>
          <OffscreenRive />
        </div>
      </div>
      <BlockMainThreadButton />
    </div>
  );
}

export default App;
