import { useState } from "react";
import { useDemo } from "../store/demoStore";
import { MockNoticeBanner } from "./MockNoticeBanner";

interface VoiceInputSimulatorProps {
  elderId: string;
}

const quickTexts = ["我有点头晕", "我胸口闷", "我不舒服", "我找不到路", "我今天吃什么药"];

export const VoiceInputSimulator = ({ elderId }: VoiceInputSimulatorProps) => {
  const { dispatch } = useDemo();
  const [text, setText] = useState("");

  const submit = (value: string) => {
    const finalText = value.trim();
    if (!finalText) return;
    dispatch({ type: "SIMULATE_VOICE_INPUT", elderId, text: finalText });
    setText(finalText);
  };

  return (
    <section className="panel simulator-panel">
      <div className="section-title">
        <span>语音输入模拟</span>
        <h2>文字模拟老人语音进入系统</h2>
      </div>
      <MockNoticeBanner>当前为文字模拟语音输入，后续可接 ASR / TTS，不调用真实语音服务。</MockNoticeBanner>
      <textarea
        placeholder="输入老人语音内容，例如：我有点头晕 / 我不舒服 / 我找不到路"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="button-row">
        {quickTexts.map((item) => (
          <button key={item} onClick={() => submit(item)}>
            {item}
          </button>
        ))}
        <button className="primary" onClick={() => submit(text)}>
          生成语音事件（Mock）
        </button>
      </div>
    </section>
  );
};
