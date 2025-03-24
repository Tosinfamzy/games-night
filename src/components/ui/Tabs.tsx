import React from "react";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  className = "",
}: TabsProps) {
  const variantStyles = {
    default: {
      tab: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
      activeTab: "border-blue-500 text-blue-600",
    },
    pills: {
      tab: "rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50",
      activeTab: "bg-blue-100 text-blue-700",
    },
    underline: {
      tab: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
      activeTab: "border-b-2 border-blue-500 text-blue-600",
    },
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${variantStyles[variant].tab}
                ${activeTab === tab.id ? variantStyles[variant].activeTab : ""}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
