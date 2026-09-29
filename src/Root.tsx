import React from "react";
import { Composition } from "remotion";
import { IncidentResponseLifecycle } from "./compositions/comp0";
import { PasswordManagerExplainer } from "./compositions/comp1";
import { TaxFilingProcess } from "./compositions/comp2";
import { LoanAmortizationChart } from "./compositions/comp3";
import { SalesPipelineStages } from "./compositions/comp4";
import { RecruitmentFunnelStages } from "./compositions/comp5";
import { ProductReturnFlow } from "./compositions/comp6";
import { CrowdfundingMilestoneTracker } from "./compositions/comp7";
import { HabitLoopCycle } from "./compositions/comp8";
import { BloodDonationProcess } from "./compositions/comp9";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="IncidentResponseLifecycle" component={IncidentResponseLifecycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PasswordManagerExplainer" component={PasswordManagerExplainer} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TaxFilingProcess" component={TaxFilingProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LoanAmortizationChart" component={LoanAmortizationChart} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SalesPipelineStages" component={SalesPipelineStages} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RecruitmentFunnelStages" component={RecruitmentFunnelStages} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ProductReturnFlow" component={ProductReturnFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CrowdfundingMilestoneTracker" component={CrowdfundingMilestoneTracker} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="HabitLoopCycle" component={HabitLoopCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="BloodDonationProcess" component={BloodDonationProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
