import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { CaregiverPage } from "./pages/CaregiverPage";
import { ConsentPrivacyPage } from "./pages/ConsentPrivacyPage";
import { DemoControlPage } from "./pages/DemoControlPage";
import { DocsPage } from "./pages/DocsPage";
import { ElderDashboardPage } from "./pages/ElderDashboardPage";
import { ElderProfilePage } from "./pages/ElderProfilePage";
import { FamilyPage } from "./pages/FamilyPage";
import { HardwareSimulatorPage } from "./pages/HardwareSimulatorPage";
import { InstitutionPage } from "./pages/InstitutionPage";
import { MemoryIntakePage } from "./pages/MemoryIntakePage";
import { MedicationPage } from "./pages/MedicationPage";
import { MockBackendContractPage } from "./pages/MockBackendContractPage";
import { PilotPlanPage } from "./pages/PilotPlanPage";
import { WearableImportPage } from "./pages/WearableImportPage";

const getCurrentPath = () => {
  const path = window.location.hash.replace(/^#/, "");
  return path || "/institution";
};

const renderRoute = (path: string) => {
  if (path === "/institution") return <InstitutionPage />;
  if (path === "/caregiver") return <CaregiverPage />;
  if (path.startsWith("/elder/") && path.endsWith("/memory-intake")) {
    return <MemoryIntakePage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/memory-intake/")) {
    return <MemoryIntakePage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/elder/") && path.endsWith("/wearable-import")) {
    return <WearableImportPage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/wearable-import/")) {
    return <WearableImportPage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/elder/") && path.endsWith("/profile")) {
    return <ElderProfilePage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/elder/") && path.endsWith("/privacy")) {
    return <ConsentPrivacyPage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/elder/")) {
    return <ElderDashboardPage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/medication/")) {
    return <MedicationPage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path.startsWith("/family/")) {
    return <FamilyPage elderId={path.split("/")[2] || "E001"} />;
  }
  if (path === "/demo-control") return <DemoControlPage />;
  if (path === "/hardware-simulator") return <HardwareSimulatorPage />;
  if (path === "/backend-contract") return <MockBackendContractPage />;
  if (path === "/privacy") return <ConsentPrivacyPage />;
  if (path === "/pilot-plan") return <PilotPlanPage />;
  if (path === "/docs") return <DocsPage />;
  return <InstitutionPage />;
};

export const App = () => {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#/institution";
    }
    const handleHashChange = () => setPath(getCurrentPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return <AppShell currentPath={path}>{renderRoute(path)}</AppShell>;
};
