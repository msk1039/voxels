import { describe, expect, it } from "vitest";

import { processGridWorkerRequest } from "../../lib/grid/worker-protocol";

describe("grid worker protocol", () => {
  it("serializes a successful grid evaluation", () => {
    const response = processGridWorkerRequest({
      id: 7,
      source: "x == 0 && y == 0",
      mode: "2d",
      grid: { min: -1, max: 1, step: 1 },
    });

    expect(response).toMatchObject({ id: 7, ok: true, complexity: 3 });
    if (response.ok) expect(response.cells).toHaveLength(1);
  });

  it("serializes source locations for equation errors", () => {
    const response = processGridWorkerRequest({
      id: 8,
      source: "x === 0",
      mode: "2d",
      grid: { min: -1, max: 1, step: 1 },
    });

    expect(response).toMatchObject({
      id: 8,
      ok: false,
      error: { code: "TOKEN", start: 4 },
    });
  });
});
