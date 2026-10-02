import React from "react";
import { Composition } from "remotion";
import { HowAHealthPlanWorks } from "./compositions/comp0";
import { SmartHomeSetupFlow } from "./compositions/comp1";
import { HomeInspectionProcess } from "./compositions/comp2";
import { ExpenseReimbursementFlow } from "./compositions/comp3";
import { CashFlowForecastCycle } from "./compositions/comp4";
import { TelehealthVisitFlow } from "./compositions/comp5";
import { OralHygieneDailyRoutine } from "./compositions/comp6";
import { FluVaccinationJourney } from "./compositions/comp7";
import { SavingsChallengeJourney } from "./compositions/comp8";
import { EventRegistrationFlow } from "./compositions/comp9";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HowAHealthPlanWorks" component={HowAHealthPlanWorks} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SmartHomeSetupFlow" component={SmartHomeSetupFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="HomeInspectionProcess" component={HomeInspectionProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ExpenseReimbursementFlow" component={ExpenseReimbursementFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CashFlowForecastCycle" component={CashFlowForecastCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TelehealthVisitFlow" component={TelehealthVisitFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="OralHygieneDailyRoutine" component={OralHygieneDailyRoutine} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="FluVaccinationJourney" component={FluVaccinationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SavingsChallengeJourney" component={SavingsChallengeJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EventRegistrationFlow" component={EventRegistrationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
