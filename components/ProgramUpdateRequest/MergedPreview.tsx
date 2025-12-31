"use client";

import { quillFormats, quillModules } from "@/utils/editor/quillConfig";
import { Edit3, Eye } from "lucide-react";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface MergedPreviewProps {
  mergedContent: string;
  onContentChange: (content: string) => void;
}

const MergedPreview: React.FC<MergedPreviewProps> = ({ mergedContent, onContentChange }) => {
  return (
    <div className="space-y-4">
      {/* Header with Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Edit3 className="text-blue-600" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Final Merged Preview (Editable)
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              This is the final content that will be saved when you approve. It's generated
              automatically based on your accepted/rejected changes, but you can manually edit it
              below before approving.
            </p>
          </div>
        </div>
      </div>

      {/* React Quill Editor */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
          <Eye size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Edit Final Content</span>
        </div>

        <div className="bg-white">
          <ReactQuill
            theme="snow"
            value={mergedContent}
            onChange={onContentChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Merged content will appear here..."
            className="min-h-75"
          />
        </div>
      </div>

      {/* Word Count */}
      <div className="text-right text-xs text-gray-500">
        {mergedContent
          ? `${
              mergedContent
                .replace(/<[^>]*>/g, "")
                .trim()
                .split(/\s+/).length
            } words`
          : "0 words"}
      </div>
    </div>
  );
};

export default MergedPreview;
