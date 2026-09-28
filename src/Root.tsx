import React from "react";
import { Composition } from "remotion";
import { AppointmentBookingFlow } from "./compositions/comp0";
import { CrossBorderRemittance } from "./compositions/comp1";
import { ESignatureSigningFlow } from "./compositions/comp2";
import { EventCheckinFlow } from "./compositions/comp3";
import { KYCVerificationFlow } from "./compositions/comp4";
import { NetZeroJourney } from "./compositions/comp5";
import { SavingsGoalTracker } from "./compositions/comp6";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AppointmentBookingFlow" component={AppointmentBookingFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CrossBorderRemittance" component={CrossBorderRemittance} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ESignatureSigningFlow" component={ESignatureSigningFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EventCheckinFlow" component={EventCheckinFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="KYCVerificationFlow" component={KYCVerificationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="NetZeroJourney" component={NetZeroJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SavingsGoalTracker" component={SavingsGoalTracker} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
