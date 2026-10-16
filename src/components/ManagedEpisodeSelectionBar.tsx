import React from 'react';
import DownloadsSelectionBottomBar from '../screens/downloads/components/DownloadsSelectionBottomBar';
export default function ManagedEpisodeSelectionBar({
  count,
  busy,
  allSelected,
  onDone,
  onSelectAll,
  onInvertSelection,
  onDelete,
}: {
  count: number;
  busy: boolean;
  allSelected: boolean;
  onDone: () => void;
  onSelectAll: () => void;
  onInvertSelection: () => void;
  onDelete: () => void;
}) {
  return (
    <DownloadsSelectionBottomBar
      selectedCount={count}
      isDeleting={busy}
      isAllSelected={allSelected}
      onExitSelection={onDone}
      onToggleSelectAll={onSelectAll}
      onInvertSelection={onInvertSelection}
      onDeletePress={onDelete}
    />
  );
}
