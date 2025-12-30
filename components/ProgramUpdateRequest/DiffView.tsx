"use client";

import { LineChange } from '@/utils/lineDiff';
import LineChangeBlock from './LineChangeBlock';
import { CheckCircle, XCircle } from 'lucide-react';

interface DiffViewProps {
  changes: LineChange[];
  onToggleChange: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

const DiffView: React.FC<DiffViewProps> = ({ changes, onToggleChange, onAcceptAll, onRejectAll }) => {
  const stats = {
    additions: changes.filter((c) => c.type === 'added').length,
    deletions: changes.filter((c) => c.type === 'removed').length,
    modifications: changes.filter((c) => c.type === 'modified').length,
  };

  const acceptedCount = changes.filter((c) => c.isAccepted && c.type !== 'unchanged').length;
  const totalChanges = stats.additions + stats.deletions + stats.modifications;

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex gap-4 text-sm">
          <span className="text-green-700 font-medium bg-green-50 px-2 py-1 rounded">
            +{stats.additions} additions
          </span>
          <span className="text-red-700 font-medium bg-red-50 px-2 py-1 rounded">
            -{stats.deletions} deletions
          </span>
          {stats.modifications > 0 && (
            <span className="text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded">
              ~{stats.modifications} modifications
            </span>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2">
          <button
            onClick={onAcceptAll}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition"
            title="Accept all changes"
          >
            <CheckCircle size={16} />
            Accept All
          </button>
          <button
            onClick={onRejectAll}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition"
            title="Reject all changes"
          >
            <XCircle size={16} />
            Reject All
          </button>
        </div>
      </div>

      {/* Progress Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalChanges > 0 ? (acceptedCount / totalChanges) * 100 : 0}%` }}
          />
        </div>
        <span className="font-medium">
          {acceptedCount}/{totalChanges} changes accepted
        </span>
      </div>

      {/* Change Blocks */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {changes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No changes detected</p>
            <p className="text-sm mt-1">The current and requested descriptions are identical.</p>
          </div>
        ) : (
          changes.map((change) => (
            <LineChangeBlock
              key={change.id}
              change={change}
              onToggle={onToggleChange}
              showControls={change.type !== 'unchanged'}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DiffView;
