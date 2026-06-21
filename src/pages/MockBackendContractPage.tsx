import { MockNoticeBanner } from "../components/MockNoticeBanner";
import { backendContractEndpoints } from "../lib/mockBackendAdapter";
import { useDemo } from "../store/demoStore";

const clientFunctions = [
  "submitCareEvent()",
  "submitDailySnapshot()",
  "analyzeWithAgent()",
  "importWearableData()",
  "createMemoryDraft()",
  "confirmMemoryItem()",
  "updateTaskStatus()",
];

export const MockBackendContractPage = () => {
  const { state } = useDemo();

  return (
    <div className="page docs-page">
      <header className="page-header">
        <div>
          <span>后端接口占位 / Backend Contract</span>
          <h1>未来 API 承接方式</h1>
          <p>当前不接真实后端，页面展示未来如何承接真实事件、快照、任务和 Agent 分析。</p>
        </div>
      </header>
      <MockNoticeBanner>当前为前端 Mock，后续可将 mockBackendAdapter 替换为真实 HTTP API client。</MockNoticeBanner>
      <section className="panel">
        <div className="section-title">
          <span>API Contract</span>
          <h2>未来后端接口</h2>
        </div>
        <div className="table-wrap">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>用途</th>
                <th>当前状态</th>
              </tr>
            </thead>
            <tbody>
              {backendContractEndpoints.map((endpoint) => (
                <tr key={endpoint.path}>
                  <td>{endpoint.method}</td>
                  <td><code>{endpoint.path}</code></td>
                  <td>{endpoint.description}</td>
                  <td>前端 Mock / Future API</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="two-column">
        <article className="panel">
          <div className="section-title">
            <span>Mock Client</span>
            <h2>可替换函数</h2>
          </div>
          <ul className="insight-list">
            {clientFunctions.map((item) => (
              <li key={item}><code>{item}</code> 当前返回 Promise.resolve(mockResponse)，模拟 300-800ms loading。</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <div className="section-title">
            <span>Mock Backend Logs</span>
            <h2>最近前端模拟调用</h2>
          </div>
          <ul className="event-list">
            {state.mockBackendLogs.slice(0, 8).map((log) => (
              <li key={log.id}>
                <time>{log.method}</time>
                <span>{log.endpoint} · {log.message}</span>
              </li>
            ))}
            {!state.mockBackendLogs.length ? (
              <li>
                <time>Mock</time>
                <span>尚无模拟调用，触发硬件事件或导入数据后会出现在这里。</span>
              </li>
            ) : null}
          </ul>
        </article>
      </section>
    </div>
  );
};
