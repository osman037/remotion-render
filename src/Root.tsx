import React from "react";
import { Composition } from "remotion";
import { SigmaRules } from "./compositions/comp0";
import { NeonHustle } from "./compositions/comp1";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SigmaRules" component={SigmaRules} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="NeonHustle" component={NeonHustle} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
