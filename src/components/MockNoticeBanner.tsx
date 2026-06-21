interface MockNoticeBannerProps {
  children?: string;
}

export const MockNoticeBanner = ({ children }: MockNoticeBannerProps) => (
  <div className="mock-notice">
    {children ??
      "当前为前端模拟数据 / Mock 流程，后续可替换为真实后端、QwenPaw Agent 或穿戴设备接入。"}
  </div>
);
