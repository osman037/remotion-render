import React from "react";
import { Composition } from "remotion";
import { HSAAccountMechanics } from "./compositions/comp0";
import { CollegeSavings529Journey } from "./compositions/comp1";
import { ProbateProcessFlow } from "./compositions/comp2";
import { LifeInsuranceApplicationFlow } from "./compositions/comp3";
import { OnlineCourseCreationFlow } from "./compositions/comp4";
import { CataractSurgeryJourney } from "./compositions/comp5";
import { HomeCompostingProcess } from "./compositions/comp6";
import { SATPrepJourney } from "./compositions/comp7";
import { ShipAPackageFlow } from "./compositions/comp8";
import { VetCheckupVisit } from "./compositions/comp9";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HSAAccountMechanics" component={HSAAccountMechanics} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CollegeSavings529Journey" component={CollegeSavings529Journey} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ProbateProcessFlow" component={ProbateProcessFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="LifeInsuranceApplicationFlow" component={LifeInsuranceApplicationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="OnlineCourseCreationFlow" component={OnlineCourseCreationFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CataractSurgeryJourney" component={CataractSurgeryJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="HomeCompostingProcess" component={HomeCompostingProcess} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="SATPrepJourney" component={SATPrepJourney} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ShipAPackageFlow" component={ShipAPackageFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="VetCheckupVisit" component={VetCheckupVisit} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
