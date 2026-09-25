import React from "react";
import { Composition } from "remotion";
import { GPUTrainingMonitor } from "./compositions/comp0";
import { EcommerceBarRace } from "./compositions/comp1";
import { BiometricFaceScan } from "./compositions/comp2";
import { CandlestickTickerTape } from "./compositions/comp3";
import { EKGMedicalMonitor } from "./compositions/comp4";
import { GrowthMindsetKineticType } from "./compositions/comp5";
import { ContourRingsLoop } from "./compositions/comp6";
import { CarbonEmissionsDashboard } from "./compositions/comp7";
import { CICDPipelineDeploy } from "./compositions/comp8";
import { NeonCountdownRing } from "./compositions/comp9";
import { GlitchTransitionSampler } from "./compositions/comp10";
import { CorporateLowerThirds } from "./compositions/comp11";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GPUTrainingMonitor" component={GPUTrainingMonitor} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EcommerceBarRace" component={EcommerceBarRace} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="BiometricFaceScan" component={BiometricFaceScan} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CandlestickTickerTape" component={CandlestickTickerTape} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EKGMedicalMonitor" component={EKGMedicalMonitor} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="GrowthMindsetKineticType" component={GrowthMindsetKineticType} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ContourRingsLoop" component={ContourRingsLoop} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CarbonEmissionsDashboard" component={CarbonEmissionsDashboard} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CICDPipelineDeploy" component={CICDPipelineDeploy} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="NeonCountdownRing" component={NeonCountdownRing} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="GlitchTransitionSampler" component={GlitchTransitionSampler} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CorporateLowerThirds" component={CorporateLowerThirds} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
