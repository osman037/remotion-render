import React from "react";
import { Composition } from "remotion";
import { ShamashLightsFirstCandle } from "./compositions/comp0";
import { WindowAtDusk } from "./compositions/comp1";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ShamashLightsFirstCandle" component={ShamashLightsFirstCandle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="WindowAtDusk" component={WindowAtDusk} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
