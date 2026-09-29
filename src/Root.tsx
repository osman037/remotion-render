import React from "react";
import { Composition } from "remotion";
import { HalloweenPumpkinReveal } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HalloweenPumpkinReveal"
      component={HalloweenPumpkinReveal}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={540}
    />
  </>
);
