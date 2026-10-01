import React from "react";
import { Composition } from "remotion";
import { AgileSprintCycle } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AgileSprintCycle"
      component={AgileSprintCycle}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
