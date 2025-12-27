"use client";

import Modal from "@/components/Model";
import { Department } from "@/utils/types/department";

interface DescriptionModalProps {
  title: string;
  description: string;
  departments?: Department[];
  footer?: React.ReactNode;
  onClose: () => void;
  isLoading?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

/**
 * Reusable modal for displaying program descriptions
 *
 * Used in:
 * - ShowEvent.tsx (view program details)
 * - ProgramForm.tsx (preview before creating)
 * - Any other place that needs to display program descriptions
 *
 * Features:
 * - Uses existing Modal component as base
 * - Displays program title, description (React Quill HTML), and departments
 * - Vertically scrollable content (Y-axis)
 * - No horizontal scrolling (X-axis disabled)
 * - Fully responsive
 * - Configurable max-width
 */
const DescriptionModal: React.FC<DescriptionModalProps> = ({
  title,
  description,
  departments = [],
  footer,
  onClose,
  isLoading = false,
  maxWidth = "3xl",
}) => {
  // Map maxWidth to Tailwind classes
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <Modal onClose={onClose} isLoading={isLoading}>
      {/* Container with proper width and scrolling */}
      <div className={`w-full ${maxWidthClass} mx-auto flex flex-col overflow-x-hidden`} style={{ maxHeight: "calc(85vh - 100px)" }}>
        {/* Title - Fixed */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#044241] mb-6 break-words flex-shrink-0">
          {title}
        </h2>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 min-h-0">
          {/* Description Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#2D6F6D] mb-3">
              Description
            </h3>

            {/* Description Content - Preserves all formatting */}
            <div
              className="prose prose-sm max-w-none program-description break-words"
              style={{
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {/* Departments */}
          {departments && departments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#2D6F6D] mb-3">
                Assigned Departments
              </h3>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept) => (
                  <span
                    key={dept._id}
                    className="rounded-full bg-[#E6F2F1] px-4 py-2 text-sm font-medium text-[#044241] break-words"
                  >
                    {dept.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optional Footer - Fixed */}
        {footer && (
          <div className="mt-6 pt-6 border-t border-gray-200 overflow-x-hidden flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DescriptionModal;
