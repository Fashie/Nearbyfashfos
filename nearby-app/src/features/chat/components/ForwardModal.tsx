import React, { useState } from 'react';
import { X, Search, Check, Send } from 'lucide-react';
import { Neighbor } from '../../../types';

interface ForwardModalProps {
  neighbors: Neighbor[];
  onForward: (selectedNeighborIds: string[]) => void;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  neighbors,
  onForward,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = neighbors.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (selectedIds.length === 0) return;
    onForward(selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#181A1D] border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-[16px] font-bold text-white">Forward message to</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-neutral-800">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search neighbors..."
              className="w-full h-10 pl-9 pr-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#0F8A5F]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((nb) => {
            const isSelected = selectedIds.includes(nb.id);
            return (
              <button
                key={nb.id}
                type="button"
                onClick={() => toggleSelect(nb.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer ${
                  isSelected ? 'bg-[#0F8A5F]/15 border border-[#0F8A5F]/40' : 'hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold ${nb.avatarColor}`}>
                    {nb.avatarEmoji || nb.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <h3 className="text-[14px] font-semibold text-white">{nb.name}</h3>
                    <p className="text-[12px] text-neutral-400">{nb.streetName}</p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                    isSelected
                      ? 'bg-[#0F8A5F] border-[#0F8A5F] text-white'
                      : 'border-neutral-700 bg-neutral-800 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={selectedIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[#0F8A5F] hover:bg-[#0C7A53] text-white text-[13px] font-semibold flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-md"
          >
            <span>Forward ({selectedIds.length})</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
