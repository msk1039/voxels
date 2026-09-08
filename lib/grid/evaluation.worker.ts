/// <reference lib="webworker" />

import {
  GridWorkerRequest,
  processGridWorkerRequest,
} from "./worker-protocol";

const worker = self as DedicatedWorkerGlobalScope;

worker.addEventListener("message", (event: MessageEvent<GridWorkerRequest>) => {
  worker.postMessage(processGridWorkerRequest(event.data));
});

export {};
