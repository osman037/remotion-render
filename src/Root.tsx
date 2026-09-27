import React from "react";
import { Composition } from "remotion";
import { TelehealthVisitJourney } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TelehealthVisitJourney"
      component={TelehealthVisitJourney}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
