import React from "react";
import { Composition } from "remotion";
import { ProductReturnFlow } from "./compositions/comp0";
import { PasswordManagerExplainer } from "./compositions/comp1";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ProductReturnFlow" component={ProductReturnFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="PasswordManagerExplainer" component={PasswordManagerExplainer} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
