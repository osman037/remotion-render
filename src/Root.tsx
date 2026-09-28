import React from "react";
import { Composition } from "remotion";
import { FitnessWorkoutProgress } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FitnessWorkoutProgress"
      component={FitnessWorkoutProgress}
      width={3840}
      height={2160}
      fps={60}
      durationInFrames={900}
    />
  </>
);
