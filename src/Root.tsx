import React from "react";
import { Composition } from "remotion";
import { CybersecurityNetworkMap } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="CybersecurityNetworkMap"
      component={CybersecurityNetworkMap}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
