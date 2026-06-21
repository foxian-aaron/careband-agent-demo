import { FallRiskSimulator } from "../components/FallRiskSimulator";
import { HardwareSimulator } from "../components/HardwareSimulator";
import { LocationRiskSimulator } from "../components/LocationRiskSimulator";
import { VoiceInputSimulator } from "../components/VoiceInputSimulator";

interface HardwareSimulatorPageProps {
  elderId?: string;
}

export const HardwareSimulatorPage = ({ elderId = "E001" }: HardwareSimulatorPageProps) => (
  <div className="page">
    <header className="page-header">
      <div>
        <span>硬件原型模拟 / Hardware Prototype Simulator</span>
        <h1>虚拟手环事件入口</h1>
        <p>展示按钮、SOS、跌倒、设备状态、语音和安全区事件如何进入照护闭环。</p>
      </div>
      <a className="primary-link" href={`#/elder/${elderId}`}>
        返回驾驶舱
      </a>
    </header>
    <HardwareSimulator elderId={elderId} />
    <section className="two-column">
      <VoiceInputSimulator elderId={elderId} />
      <LocationRiskSimulator elderId={elderId} />
    </section>
    <FallRiskSimulator elderId={elderId} />
  </div>
);
