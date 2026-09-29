import React from "react";
import { Composition } from "remotion";
import { ProductReturnFlow } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ProductReturnFlow"
      component={ProductReturnFlow}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
