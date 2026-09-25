import React from "react";
import { Composition } from "remotion";
import { CybersecurityNetworkMap } from "./compositions/comp0";
import { AIDashboardOverlay } from "./compositions/comp1";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CybersecurityNetworkMap" component={CybersecurityNetworkMap} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="AIDashboardOverlay" component={AIDashboardOverlay} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
