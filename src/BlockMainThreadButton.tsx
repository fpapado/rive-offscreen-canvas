function fibonacci(n: number): number {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

export function BlockMainThreadButton() {
  return (
    <button
      className="blockMainThreadButton"
      onClick={() => {
        console.log(fibonacci(42));
      }}
    >
      Block main thread
    </button>
  );
}
