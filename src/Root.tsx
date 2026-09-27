import React from "react";
import { Composition } from "remotion";
import { BenefitsOpenEnrollment } from "./compositions/comp0";
import { CustomsClearanceFlow } from "./compositions/comp1";
import { EVChargingAvailabilityMap } from "./compositions/comp2";
import { InsurancePremiumDeductible } from "./compositions/comp3";
import { LoyaltyPointsEarnRedeem } from "./compositions/comp4";
import { LoyaltyTierProgression } from "./compositions/comp5";
import { MortgageApplicationJourney } from "./compositions/comp6";
import { TelehealthVisitJourney } from "./compositions/comp7";
import { VoterRegistrationJourney } from "./compositions/comp8";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BenefitsOpenEnrollment" component={BenefitsOpenEnrollment} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CustomsClearanceFlow" component={CustomsClearanceFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EVChargingAvailabilityMap" component={EVChargingAvailabilityMap} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="InsurancePremiumDeductible" component={InsurancePremiumDeductible} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LoyaltyPointsEarnRedeem" component={LoyaltyPointsEarnRedeem} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LoyaltyTierProgression" component={LoyaltyTierProgression} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="MortgageApplicationJourney" component={MortgageApplicationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TelehealthVisitJourney" component={TelehealthVisitJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="VoterRegistrationJourney" component={VoterRegistrationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
