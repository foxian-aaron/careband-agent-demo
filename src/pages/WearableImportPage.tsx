import { useState } from "react";
import { DataQualityBadge } from "../components/DataQualityBadge";
import { MockNoticeBanner } from "../components/MockNoticeBanner";
import { WearableDataSourceBadge } from "../components/WearableDataSourceBadge";
import { importWearableData } from "../lib/mockBackendAdapter";
import {
  chenWearableSevenDayCsv,
  parseWearableCsv,
  wearableCsvExample,
} from "../lib/wearableImport";
import { useDemo } from "../store/demoStore";
import type { WearableDataSource } from "../types";

interface WearableImportPageProps {
  elderId: string;
}

const sources: WearableDataSource[] = [
  "Mock Data",
  "Apple Health",
  "Android Health Connect",
  "Fitbit",
  "Zepp / Amazfit",
  "CSV",
];

export const WearableImportPage = ({ elderId }: WearableImportPageProps) => {
  const { state, dispatch } = useDemo();
  const profile = state.profiles[elderId] ?? state.profiles.E001;
  const [source, setSource] = useState<WearableDataSource>("CSV");
  const [csv, setCsv] = useState(wearableCsvExample);
  const [loading, setLoading] = useState(false);
  const latestImport = state.wearableImports[profile.elderId]?.[0];

  const runImport = async (csvText: string, dataSource: WearableDataSource) => {
    const snapshots = parseWearableCsv(profile.elderId, csvText, dataSource);
    if (!snapshots.length) return;
    setLoading(true);
    await importWearableData(snapshots);
    dispatch({
      type: "IMPORT_WEARABLE_DATA",
      elderId: profile.elderId,
      source: dataSource,
      snapshots,
    });
    setLoading(false);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>穿戴数据导入 / Wearable Data Import</span>
          <h1>{profile.name}穿戴数据导入模拟</h1>
          <p>展示未来如何接入 Apple Health / Health Connect / Fitbit / Zepp / CSV 数据。</p>
        </div>
        <a className="primary-link" href={`#/elder/${profile.elderId}`}>
          返回驾驶舱
        </a>
      </header>

      <MockNoticeBanner>当前为模拟导入，后续可替换为 Apple Health / Health Connect / Fitbit / Zepp API。</MockNoticeBanner>

      <section className="panel wearable-import-form">
        <div className="section-title">
          <span>数据来源选择</span>
          <h2>选择导入通道</h2>
        </div>
        <div className="source-grid">
          {sources.map((item) => (
            <button
              className={source === item ? "active" : ""}
              key={item}
              onClick={() => setSource(item)}
            >
              {item}
              {item !== "Mock Data" && item !== "CSV" ? "（未来接入）" : ""}
            </button>
          ))}
        </div>
        <WearableDataSourceBadge source={source} />
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} />
        <div className="button-row">
          <button className="primary" disabled={loading} onClick={() => runImport(csv, source)}>
            {loading ? "导入中..." : "导入 CSV 数据（Mock）"}
          </button>
          <button
            onClick={() => {
              setSource("CSV");
              setCsv(chenWearableSevenDayCsv);
              void runImport(chenWearableSevenDayCsv, "CSV");
            }}
          >
            导入陈伯 7 天穿戴示例数据
          </button>
        </div>
      </section>

      {latestImport ? (
        <section className="panel">
          <div className="section-title">
            <span>DailySnapshot 列表</span>
            <h2>最近一次导入结果</h2>
          </div>
          <div className="table-wrap">
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th>date</th>
                  <th>steps</th>
                  <th>heart_rate_avg</th>
                  <th>sleep_duration</th>
                  <th>active_minutes</th>
                  <th>wear_time_hours</th>
                  <th>data_quality</th>
                </tr>
              </thead>
              <tbody>
                {latestImport.snapshots.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <td>{snapshot.date}</td>
                    <td>{snapshot.steps}</td>
                    <td>{snapshot.heartRateAvg}</td>
                    <td>{snapshot.sleepDuration}</td>
                    <td>{snapshot.activeMinutes}</td>
                    <td>{snapshot.wearTimeHours}</td>
                    <td><DataQualityBadge quality={snapshot.dataQuality} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
};
