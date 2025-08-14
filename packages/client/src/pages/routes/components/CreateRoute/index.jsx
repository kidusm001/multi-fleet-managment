import { useState } from "react";

function CreateRoute({ onRouteCreated }) {
  const [name, setName] = useState("");
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Create Route</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // placeholder: call parent refresh
          if (onRouteCreated) onRouteCreated();
          setName("");
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Route name"
          className="border rounded px-2 py-1"
        />
        <button type="submit" className="border rounded px-3 py-1">
          Save
        </button>
      </form>
    </div>
  );
}

// no prop-types; using simple JS props for now

export default CreateRoute;