import React from "react";
import { Composition } from "remotion";
import { Particles } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Particles"
      component={Particles}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={540}
    />
  </>
);
