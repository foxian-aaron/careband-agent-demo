import { AgentTracePanel } from "../components/AgentTracePanel";
import { DemoControlPanel } from "../components/DemoControlPanel";
import { FallRiskSimulator } from "../components/FallRiskSimulator";
import { HardwareSimulator } from "../components/HardwareSimulator";
import { LocationRiskSimulator } from "../components/LocationRiskSimulator";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
import { VoiceInputSimulator } from "../components/VoiceInputSimulator";
import { useDemo } from "../store/demoStore";

export const DemoControlPage = () => {
  const { state, dispatch } = useDemo();
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>Demo 控制台</span>
          <h1>一键推进路演场景</h1>
          <p>用于演示陈伯从需关注到高风险，再到护工处理完成的闭环。</p>
        </div>
      </header>
      <DemoControlPanel state={state} dispatch={dispatch} />
      <HardwareSimulator elderId="E001" />
      <section className="two-column">
        <VoiceInputSimulator elderId="E001" />
        <LocationRiskSimulator elderId="E001" />
      </section>
      <FallRiskSimulator elderId="E001" />
      <AgentTracePanel elderId="E001" />
      <MedicalDisclaimer />
    </div>
  );
};
