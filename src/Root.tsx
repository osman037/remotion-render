import React from "react";
import { Composition } from "remotion";
import { CheckoutPaymentFlow } from "./compositions/comp0";
import { InsuranceClaimJourney } from "./compositions/comp1";
import { ParcelRouteTracking } from "./compositions/comp2";
import { SmartHomeEnergyFlow } from "./compositions/comp3";
import { DonationThermometer } from "./compositions/comp4";
import { StudyTimerOverlay } from "./compositions/comp5";
import { RankingRaceCharts } from "./compositions/comp6";
import { TravelPriceTrends } from "./compositions/comp7";
import { WellnessTrackingDashboard } from "./compositions/comp8";
import { ProjectTimelineGantt } from "./compositions/comp9";
import { MLTrainingDashboard } from "./compositions/comp10";
import { FinancialNewsGraphics } from "./compositions/comp11";
import { EconomicIndicatorInfographics } from "./compositions/comp12";
import { TourismStatisticsInfographics } from "./compositions/comp13";
import { AIAnalyticsOverlay } from "./compositions/comp14";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CheckoutPaymentFlow" component={CheckoutPaymentFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="InsuranceClaimJourney" component={InsuranceClaimJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ParcelRouteTracking" component={ParcelRouteTracking} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SmartHomeEnergyFlow" component={SmartHomeEnergyFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DonationThermometer" component={DonationThermometer} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="StudyTimerOverlay" component={StudyTimerOverlay} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RankingRaceCharts" component={RankingRaceCharts} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TravelPriceTrends" component={TravelPriceTrends} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="WellnessTrackingDashboard" component={WellnessTrackingDashboard} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ProjectTimelineGantt" component={ProjectTimelineGantt} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="MLTrainingDashboard" component={MLTrainingDashboard} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="FinancialNewsGraphics" component={FinancialNewsGraphics} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EconomicIndicatorInfographics" component={EconomicIndicatorInfographics} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TourismStatisticsInfographics" component={TourismStatisticsInfographics} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="AIAnalyticsOverlay" component={AIAnalyticsOverlay} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
