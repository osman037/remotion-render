import React from "react";
import { Composition } from "remotion";
import { BackgroundCheckProcess } from "./compositions/comp0";
import { ClosingCostBreakdown } from "./compositions/comp1";
import { CreatorMonetizationJourney } from "./compositions/comp2";
import { FinancialAidApplicationJourney } from "./compositions/comp3";
import { MarketplaceSellerFees } from "./compositions/comp4";
import { PasswordHealthAudit } from "./compositions/comp5";
import { PayrollRunCycle } from "./compositions/comp6";
import { PodcastDistributionFlow } from "./compositions/comp7";
import { RentalApplicationProcess } from "./compositions/comp8";
import { RestaurantTicketFlow } from "./compositions/comp9";
import { SupportTicketTriage } from "./compositions/comp10";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BackgroundCheckProcess" component={BackgroundCheckProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ClosingCostBreakdown" component={ClosingCostBreakdown} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CreatorMonetizationJourney" component={CreatorMonetizationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="FinancialAidApplicationJourney" component={FinancialAidApplicationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="MarketplaceSellerFees" component={MarketplaceSellerFees} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PasswordHealthAudit" component={PasswordHealthAudit} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PayrollRunCycle" component={PayrollRunCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PodcastDistributionFlow" component={PodcastDistributionFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RentalApplicationProcess" component={RentalApplicationProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RestaurantTicketFlow" component={RestaurantTicketFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SupportTicketTriage" component={SupportTicketTriage} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
