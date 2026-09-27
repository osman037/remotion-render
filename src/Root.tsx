import React from "react";
import { Composition } from "remotion";
import { EVChargingAvailabilityMap } from "./compositions/comp0";
import { LoyaltyPointsEarnRedeem } from "./compositions/comp1";
import { LoyaltyTierProgression } from "./compositions/comp2";
import { TelehealthVisitJourney } from "./compositions/comp3";
import { MortgageApplicationJourney } from "./compositions/comp4";
import { InsurancePremiumDeductible } from "./compositions/comp5";
import { BenefitsOpenEnrollment } from "./compositions/comp6";
import { VoterRegistrationJourney } from "./compositions/comp7";
import { CustomsClearanceFlow } from "./compositions/comp8";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EVChargingAvailabilityMap" component={EVChargingAvailabilityMap} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LoyaltyPointsEarnRedeem" component={LoyaltyPointsEarnRedeem} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LoyaltyTierProgression" component={LoyaltyTierProgression} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TelehealthVisitJourney" component={TelehealthVisitJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="MortgageApplicationJourney" component={MortgageApplicationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="InsurancePremiumDeductible" component={InsurancePremiumDeductible} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="BenefitsOpenEnrollment" component={BenefitsOpenEnrollment} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="VoterRegistrationJourney" component={VoterRegistrationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CustomsClearanceFlow" component={CustomsClearanceFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
