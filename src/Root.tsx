/**
 * Root.tsx — Registers all Remotion compositions.
 * ⚠️  Do NOT edit width/height/fps/durationInFrames here.
 *      Those are locked to 4K·60fps·15s (900 frames) for Adobe Stock delivery.
 *      The render pipeline passes --width --height --fps --frames flags anyway
 *      as a double-safety, but keeping them here makes studio preview correct.
 */
import React from "react";
import { Composition } from "remotion";
import { CybersecurityNetworkMap } from "./composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CybersecurityNetworkMap"
        component={CybersecurityNetworkMap}
        width={3840}
        height={2160}
        fps={60}
        durationInFrames={900}   // 15 seconds × 60 fps
      />
    </>
  );
};
