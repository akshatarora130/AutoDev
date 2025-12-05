import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Frontend App</h1>
      <p>Base React application</p>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
}
