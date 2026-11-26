import React from "react";
import { Composition } from "remotion";
import { EightNightsOneByOne } from "./compositions/comp0";
import { ShamashLightsFirstCandle } from "./compositions/comp1";
import { DreidelLandsOnGimel } from "./compositions/comp2";
import { WindowAtDusk } from "./compositions/comp3";
import { FestivalLightsCountdown } from "./compositions/comp4";
import { HolidayTableTopDown } from "./compositions/comp5";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EightNightsOneByOne" component={EightNightsOneByOne} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ShamashLightsFirstCandle" component={ShamashLightsFirstCandle} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DreidelLandsOnGimel" component={DreidelLandsOnGimel} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="WindowAtDusk" component={WindowAtDusk} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="FestivalLightsCountdown" component={FestivalLightsCountdown} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="HolidayTableTopDown" component={HolidayTableTopDown} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
