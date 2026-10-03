import React from "react";
import { Composition } from "remotion";
import { BuyNowPayLaterSchedule } from "./compositions/comp0";
import { ProcurementApprovalCycle } from "./compositions/comp1";
import { ForkliftCertificationJourney } from "./compositions/comp2";
import { ContactlessTransitFareFlow } from "./compositions/comp3";
import { PetInsuranceClaimFlow } from "./compositions/comp4";
import { ChoreAllowanceCycle } from "./compositions/comp5";
import { EmergencyFundJourney } from "./compositions/comp6";
import { HomeWarrantyClaimFlow } from "./compositions/comp7";
import { TrademarkRegistrationFlow } from "./compositions/comp8";
import { ClinicalTrialEnrollmentFlow } from "./compositions/comp9";
import { ColdChainMonitoringProcess } from "./compositions/comp10";
import { MedicationAdherenceCycle } from "./compositions/comp11";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BuyNowPayLaterSchedule" component={BuyNowPayLaterSchedule} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ProcurementApprovalCycle" component={ProcurementApprovalCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ForkliftCertificationJourney" component={ForkliftCertificationJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ContactlessTransitFareFlow" component={ContactlessTransitFareFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PetInsuranceClaimFlow" component={PetInsuranceClaimFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ChoreAllowanceCycle" component={ChoreAllowanceCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EmergencyFundJourney" component={EmergencyFundJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="HomeWarrantyClaimFlow" component={HomeWarrantyClaimFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TrademarkRegistrationFlow" component={TrademarkRegistrationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ClinicalTrialEnrollmentFlow" component={ClinicalTrialEnrollmentFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ColdChainMonitoringProcess" component={ColdChainMonitoringProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="MedicationAdherenceCycle" component={MedicationAdherenceCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
