import React from "react";
import { Composition } from "remotion";
import { MenorahFlameGlow } from "./compositions/comp0";
import { DreidelSpinLoop } from "./compositions/comp1";
import { StarOfDavidMandala } from "./compositions/comp2";
import { BlueGoldBokehNight } from "./compositions/comp3";
import { CandleFlameEmbers } from "./compositions/comp4";
import { HanukkahLightsParade } from "./compositions/comp5";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MenorahFlameGlow" component={MenorahFlameGlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DreidelSpinLoop" component={DreidelSpinLoop} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="StarOfDavidMandala" component={StarOfDavidMandala} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="BlueGoldBokehNight" component={BlueGoldBokehNight} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CandleFlameEmbers" component={CandleFlameEmbers} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="HanukkahLightsParade" component={HanukkahLightsParade} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
