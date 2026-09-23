import { Config } from "@remotion/cli/config";

// Tell Remotion where the entry point is
Config.setEntryPoint("./src/index.ts");

// Use Chromium in the CI environment
Config.setBrowserExecutable(
  process.env.BROWSER_EXECUTABLE ||
  "/usr/bin/chromium-browser"
);

// Concurrency: 4 threads — safe for GitHub-hosted runners (2-core CPU)
Config.setConcurrency(4);

// Video quality — CRF 18 is near-lossless for H.264
Config.setQuality(100);

// Output codec
Config.setCodec("h264");

// Pixel format required for broad compatibility (Adobe Premiere, DaVinci etc.)
Config.setPixelFormat("yuv420p");
