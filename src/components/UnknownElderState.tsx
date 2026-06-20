interface UnknownElderStateProps {
  elderId: string;
}

export const UnknownElderState = ({ elderId }: UnknownElderStateProps) => (
  <div className="page">
    <section className="empty-state empty-state--page">
      <strong>資料未載入：找不到此長者資料。</strong>
      <p>
        目前路由 elderId 為 {elderId || "空值"}。系統不會再自動 fallback 到陳伯 E001，
        以避免公網審閱時誤讀 Demo 資料。
      </p>
      <div className="button-row">
        <a className="primary-link" href="#/institution">
          返回機構端
        </a>
        <a className="text-button" href="#/elder/E001">
          查看陳伯 E001 Demo
        </a>
        <a className="text-button" href="#/elder/TEST001">
          查看 TEST001 Apple Watch 測試資料
        </a>
      </div>
    </section>
  </div>
);

