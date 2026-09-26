import React from "react";
import { Composition } from "remotion";
import { CSRDMaterialityMatrix } from "./compositions/comp0";
import { CBAMCertificateFlow } from "./compositions/comp1";
import { AIAgentOrchestration } from "./compositions/comp2";
import { EIAIActCompliance } from "./compositions/comp3";
import { NIS2IncidentReporting } from "./compositions/comp4";
import { ZeroTrustAccessFlow } from "./compositions/comp5";
import { StablecoinPaymentRail } from "./compositions/comp6";
import { RAGPipelineFlow } from "./compositions/comp7";
import { FinOpsCloudDashboard } from "./compositions/comp8";
import { RemotePatientMonitoring } from "./compositions/comp9";
import { DistributedTracingWaterfall } from "./compositions/comp10";
import { MFAExpiryTimer } from "./compositions/comp11";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CSRDMaterialityMatrix" component={CSRDMaterialityMatrix} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="CBAMCertificateFlow" component={CBAMCertificateFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="AIAgentOrchestration" component={AIAgentOrchestration} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="EIAIActCompliance" component={EIAIActCompliance} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="NIS2IncidentReporting" component={NIS2IncidentReporting} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="ZeroTrustAccessFlow" component={ZeroTrustAccessFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="StablecoinPaymentRail" component={StablecoinPaymentRail} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RAGPipelineFlow" component={RAGPipelineFlow} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="FinOpsCloudDashboard" component={FinOpsCloudDashboard} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="RemotePatientMonitoring" component={RemotePatientMonitoring} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="DistributedTracingWaterfall" component={DistributedTracingWaterfall} width={3840} height={2160} fps={60} durationInFrames={900} />
    <Composition id="MFAExpiryTimer" component={MFAExpiryTimer} width={3840} height={2160} fps={60} durationInFrames={900} />
  </>
);
