"use client";

import { LineChange } from '@/utils/lineDiff';
import { Check, X } from 'lucide-react';

interface LineChangeBlockProps {
  change: LineChange;
  onToggle: (id: string) => void;
  showControls: boolean; // Only show for added/removed/modified
}

const LineChangeBlock: React.FC<LineChangeBlockProps> = ({
  change,
  onToggle,
  showControls,
}) => {
  const getBackgroundColor = () => {
    if (change.type === 'unchanged') return 'bg-white';
    if (change.type === 'added') return change.isAccepted ? 'bg-green-50' : 'bg-gray-100';
    if (change.type === 'removed') return change.isAccepted ? 'bg-gray-100' : 'bg-red-50';
    if (change.type === 'modified') return change.isAccepted ? 'bg-blue-50' : 'bg-gray-100';
    return 'bg-white';
  };

  const getBorderColor = () => {
    if (change.type === 'unchanged') return 'border-transparent';
    if (change.type === 'added') return change.isAccepted ? 'border-green-400' : 'border-gray-300';
    if (change.type === 'removed') return change.isAccepted ? 'border-gray-300' : 'border-red-400';
    if (change.type === 'modified') return change.isAccepted ? 'border-blue-400' : 'border-gray-300';
    return 'border-transparent';
  };

  const getChangeLabel = () => {
    if (change.type === 'added') return 'New paragraph added';
    if (change.type === 'removed') return 'Paragraph removed';
    if (change.type === 'modified') return 'Paragraph modified';
    return 'No changes';
  };

  return (
    <div
      className={`relative border-l-4 ${getBorderColor()} ${getBackgroundColor()} px-4 py-3 mb-2 rounded-r transition-all duration-200`}
    >
      {showControls && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => onToggle(change.id)}
            className={`p-1.5 rounded-md transition-all shadow-sm ${
              change.isAccepted
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={change.isAccepted ? 'Click to reject this change' : 'Click to accept this change'}
          >
            {change.isAccepted ? <Check size={16} /> : <X size={16} />}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
        {/* Left: Current version */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1 uppercase">Current Version</div>
          {change.currentLine ? (
            <div
              className={`prose prose-sm max-w-none ${
                change.type === 'removed' && change.isAccepted ? 'line-through opacity-60 text-red-700' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: change.currentLine }}
            />
          ) : (
            <p className="text-gray-400 italic text-sm">New content</p>
          )}
        </div>

        {/* Right: Requested version */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1 uppercase">Requested Version</div>
          {change.requestedLine ? (
            <div
              className={`prose prose-sm max-w-none ${
                change.type === 'added' && change.isAccepted ? 'font-semibold text-green-800' : ''
              } ${
                change.type === 'modified' && change.isAccepted ? 'font-semibold text-blue-800' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: change.requestedLine }}
            />
          ) : (
            <p className="text-gray-400 italic text-sm">Content removed</p>
          )}
        </div>
      </div>

      {/* Change type label */}
      {change.type !== 'unchanged' && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <span className={`text-xs ${
            change.type === 'added' ? 'text-green-700' :
            change.type === 'removed' ? 'text-red-700' :
            'text-blue-700'
          }`}>
            {getChangeLabel()} • {change.isAccepted ? 'Accepted' : 'Rejected'}
          </span>
        </div>
      )}
    </div>
  );
};

export default LineChangeBlock;
