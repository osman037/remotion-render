import React from "react";
import { Composition } from "remotion";
import { ForkliftCertificationJourney } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ForkliftCertificationJourney"
      component={ForkliftCertificationJourney}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
