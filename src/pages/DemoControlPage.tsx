import { DemoControlPanel } from "../components/DemoControlPanel";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
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
      <MedicalDisclaimer />
    </div>
  );
};
