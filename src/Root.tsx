import React from "react";
import { Composition } from "remotion";
import { BiometricFaceScan } from "./compositions/comp0";
import { CICDPipelineDeploy } from "./compositions/comp1";
import { CandlestickTickerTape } from "./compositions/comp2";
import { CarbonEmissionsDashboard } from "./compositions/comp3";
import { ContourRingsLoop } from "./compositions/comp4";
import { CorporateLowerThirds } from "./compositions/comp5";
import { EKGMedicalMonitor } from "./compositions/comp6";
import { EcommerceBarRace } from "./compositions/comp7";
import { GPUTrainingMonitor } from "./compositions/comp8";
import { GlitchTransitionSampler } from "./compositions/comp9";
import { GrowthMindsetKineticType } from "./compositions/comp10";
import { NeonCountdownRing } from "./compositions/comp11";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BiometricFaceScan" component={BiometricFaceScan} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="CICDPipelineDeploy" component={CICDPipelineDeploy} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="CandlestickTickerTape" component={CandlestickTickerTape} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="CarbonEmissionsDashboard" component={CarbonEmissionsDashboard} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="ContourRingsLoop" component={ContourRingsLoop} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="CorporateLowerThirds" component={CorporateLowerThirds} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="EKGMedicalMonitor" component={EKGMedicalMonitor} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="EcommerceBarRace" component={EcommerceBarRace} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="GPUTrainingMonitor" component={GPUTrainingMonitor} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="GlitchTransitionSampler" component={GlitchTransitionSampler} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="GrowthMindsetKineticType" component={GrowthMindsetKineticType} width={1080} height={1920} fps={60} durationInFrames={1200} />
    <Composition id="NeonCountdownRing" component={NeonCountdownRing} width={1080} height={1920} fps={60} durationInFrames={1200} />
  </>
);
