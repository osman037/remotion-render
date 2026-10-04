import React from "react";
import { Composition } from "remotion";
import { DollarCostAveragingFlow } from "./compositions/comp0";
import { LLCFormationJourney } from "./compositions/comp1";
import { ESIMSetupJourney } from "./compositions/comp2";
import { GlucoseMonitoringFlow } from "./compositions/comp3";
import { DNATestingJourney } from "./compositions/comp4";
import { PerformanceReviewCycle } from "./compositions/comp5";
import { RecyclingSortingProcess } from "./compositions/comp6";
import { DataPipelineFlow } from "./compositions/comp7";
import { CompoundInterestJourney } from "./compositions/comp8";
import { RestaurantReservationFlow } from "./compositions/comp9";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DollarCostAveragingFlow" component={DollarCostAveragingFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LLCFormationJourney" component={LLCFormationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ESIMSetupJourney" component={ESIMSetupJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="GlucoseMonitoringFlow" component={GlucoseMonitoringFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DNATestingJourney" component={DNATestingJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PerformanceReviewCycle" component={PerformanceReviewCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RecyclingSortingProcess" component={RecyclingSortingProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DataPipelineFlow" component={DataPipelineFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CompoundInterestJourney" component={CompoundInterestJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RestaurantReservationFlow" component={RestaurantReservationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
