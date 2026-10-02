import { expect, test } from "@playwright/test";

const moduleWorkerProbe = `
self.addEventListener("message", async ({ data }) => {
  try {
    const transformers = await import(data.transformers);
    const ort = await import(data.ort);
    const tensor = new ort.Tensor("float32", new Float32Array([0.25]), [1]);
    const result = {
      ok: true,
      workerContext: typeof document === "undefined",
      pipeline: typeof transformers.pipeline,
      ortVersion: ort.env.versions.web,
      tensorSize: tensor.size,
    };
    tensor.dispose();
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) });
  }
});
`;

test("pinned Transformers and ONNX ESM imports resolve in a native Worker without downloading weights", async ({ page }) => {
  const crossOriginRequests: string[] = [];
  await page.route("**/__dwnb_webgpu_module_probe__.js", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: moduleWorkerProbe }));
  const ortBundleResponse=await page.request.head("/vendor/webgpu/ort.webgpu.bundle.min.mjs");
  expect(ortBundleResponse.ok()).toBe(true);
  expect(ortBundleResponse.headers()["content-type"]).toContain("javascript");
  await page.goto("/");
  const appOrigin=new URL(page.url()).origin;
  page.on("request", (request) => { if(new URL(request.url()).origin!==appOrigin)crossOriginRequests.push(request.url()); });

  const result = await page.evaluate(() => new Promise<{ok:boolean;workerContext?:boolean;pipeline?:string;ortVersion?:string;tensorSize?:number;message?:string}>((resolve, reject) => {
    const worker = new Worker("/__dwnb_webgpu_module_probe__.js", { type: "module" });
    const timer = window.setTimeout(() => { worker.terminate(); reject(new Error("Timed out importing the vendored ESM runtime in Worker.")); }, 20_000);
    worker.addEventListener("message", (event:MessageEvent) => { window.clearTimeout(timer); worker.terminate(); resolve(event.data); }, { once:true });
    worker.addEventListener("error", (event:ErrorEvent) => { window.clearTimeout(timer); worker.terminate(); reject(new Error(event.message)); }, { once:true });
    worker.postMessage({ transformers:"/vendor/webgpu/transformers.web.min.js", ort:"/vendor/webgpu/ort.webgpu.bundle.min.mjs" });
  }));

  expect(result).toMatchObject({ ok:true, workerContext:true, pipeline:"function", ortVersion:"1.26.0-dev.20260416-b7804b056c", tensorSize:1 });
  expect(crossOriginRequests).toEqual([]);
});
