import React from "react";
import { Composition } from "remotion";
import { HSAAccountMechanics } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HSAAccountMechanics"
      component={HSAAccountMechanics}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
