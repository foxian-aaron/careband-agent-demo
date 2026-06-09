import { medicalDisclaimer } from "../lib/statusLabels";

export const MedicalDisclaimer = () => (
  <section className="medical-disclaimer" aria-label="非医疗诊断声明">
    {medicalDisclaimer}
  </section>
);
