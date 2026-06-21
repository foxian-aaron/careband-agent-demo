const navItems = [
  { href: "#/institution", label: "机构端" },
  { href: "#/caregiver", label: "护工端" },
  { href: "#/elder/TEST001", label: "TEST001 Apple Watch" },
  { href: "#/elder/E001", label: "陈伯驾驶舱" },
  { href: "#/elder/E001/memory-intake", label: "记忆初始化" },
  { href: "#/elder/E001/wearable-import", label: "穿戴导入" },
  { href: "#/elder/E001/profile", label: "老人档案" },
  { href: "#/medication/E001", label: "用药计划" },
  { href: "#/family/E001", label: "家属端" },
  { href: "#/demo-control", label: "Demo 控制台" },
  { href: "#/hardware-simulator", label: "硬件模拟" },
  { href: "#/backend-contract", label: "后端契约" },
  { href: "#/privacy", label: "隐私授权" },
  { href: "#/pilot-plan", label: "试点计划" },
  { href: "#/docs", label: "文档" },
];

interface NavigationProps {
  currentPath: string;
}

export const Navigation = ({ currentPath }: NavigationProps) => (
  <nav className="app-nav" aria-label="主导航">
    {navItems.map((item) => {
      const itemPath = item.href.replace("#", "");
      const active =
        currentPath === itemPath ||
        (itemPath.includes("memory-intake") && currentPath.includes("memory-intake")) ||
        (itemPath.includes("wearable-import") && currentPath.includes("wearable-import")) ||
        (itemPath.startsWith("/medication") && currentPath.startsWith("/medication")) ||
        (itemPath.startsWith("/family") && currentPath.startsWith("/family"));
      return (
        <a className={active ? "active" : ""} href={item.href} key={item.href}>
          {item.label}
        </a>
      );
    })}
  </nav>
);
