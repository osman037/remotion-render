import React from "react";
import { Composition } from "remotion";
import { AgileSprintCycle } from "./compositions/comp0";
import { CreditScoreBuilding } from "./compositions/comp1";
import { DebtPayoffJourney } from "./compositions/comp2";
import { EmployeeOnboardingJourney } from "./compositions/comp3";
import { InventoryReplenishmentCycle } from "./compositions/comp4";
import { PriorAuthorizationFlow } from "./compositions/comp5";
import { RetirementSavingsJourney } from "./compositions/comp6";
import { VehicleMaintenanceSchedule } from "./compositions/comp7";
import { PetAdoptionJourney } from "./compositions/comp8";
import { CropGrowthCycle } from "./compositions/comp9";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AgileSprintCycle" component={AgileSprintCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CreditScoreBuilding" component={CreditScoreBuilding} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DebtPayoffJourney" component={DebtPayoffJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EmployeeOnboardingJourney" component={EmployeeOnboardingJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="InventoryReplenishmentCycle" component={InventoryReplenishmentCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PriorAuthorizationFlow" component={PriorAuthorizationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RetirementSavingsJourney" component={RetirementSavingsJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="VehicleMaintenanceSchedule" component={VehicleMaintenanceSchedule} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PetAdoptionJourney" component={PetAdoptionJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CropGrowthCycle" component={CropGrowthCycle} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
