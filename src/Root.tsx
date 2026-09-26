import React from "react";
import { Composition } from "remotion";
import { SmartHomeEnergyFlow } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SmartHomeEnergyFlow"
      component={SmartHomeEnergyFlow}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
