import React from "react";
import { Composition } from "remotion";
import { TheRelapsePrevention } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TheRelapsePrevention"
      component={TheRelapsePrevention}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
