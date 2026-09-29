import React from "react";
import { Composition } from "remotion";
import { HalloweenKineticType } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HalloweenKineticType"
      component={HalloweenKineticType}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={720}
    />
  </>
);
