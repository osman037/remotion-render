import React from "react";
import { Composition } from "remotion";
import { EVChargingAvailabilityMap } from "./compositions/comp0";
import { TelehealthVisitJourney } from "./compositions/comp1";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EVChargingAvailabilityMap" component={EVChargingAvailabilityMap} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="TelehealthVisitJourney" component={TelehealthVisitJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
