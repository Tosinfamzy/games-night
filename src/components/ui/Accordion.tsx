import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface AccordionSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  sections: AccordionSection[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({
  sections,
  allowMultiple = false,
  defaultOpen = [],
  className = "",
}: AccordionProps) {
  const [openSections, setOpenSections] = useState<string[]>(defaultOpen);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      if (allowMultiple) {
        return prev.includes(sectionId)
          ? prev.filter((id) => id !== sectionId)
          : [...prev, sectionId];
      }
      return prev.includes(sectionId) ? [] : [sectionId];
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {sections.map((section) => {
        const isOpen = openSections.includes(section.id);

        return (
          <div
            key={section.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 focus:outline-none"
            >
              <span className="text-sm font-medium text-gray-900">
                {section.title}
              </span>
              <ChevronDownIcon
                className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                isOpen ? "max-h-96" : "max-h-0"
              }`}
            >
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                {section.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
