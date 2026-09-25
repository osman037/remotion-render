import React from "react";
import { Composition } from "remotion";
import { AdobeStockTrajectory } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AdobeStockTrajectory"
      component={AdobeStockTrajectory}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
