import React from "react";
import { Composition } from "remotion";
import { EightNightsOneByOne } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="EightNightsOneByOne"
      component={EightNightsOneByOne}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
