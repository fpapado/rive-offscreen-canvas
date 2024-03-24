import { useState } from "react";

function fibonacci(n: number): number {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

export function BlockMainThreadButton() {
  const [isBlocked, setBlocked] = useState(false);
  return (
    <button
      className="blockMainThreadButton"
      onClick={() => {
        if (isBlocked) {
          return;
        }
        setBlocked(true);
        setTimeout(() => {
          console.log(fibonacci(42));
          setBlocked(false);
        }, 100);
      }}
      aria-busy={isBlocked}
    >
      {isBlocked ? "Blocking..." : "Block main thread"}
    </button>
  );
}
