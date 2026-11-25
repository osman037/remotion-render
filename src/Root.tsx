import React from "react";
import { Composition } from "remotion";
import { MenorahFlameGlow } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MenorahFlameGlow"
      component={MenorahFlameGlow}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
