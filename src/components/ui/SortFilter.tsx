import React from 'react';
import { TrendingUp, Crown, Zap } from 'lucide-react';

type SortOption = 'interest' | 'recent' | 'weekly';

interface SortFilterProps {
  selected: SortOption;
  onChange: (sort: SortOption) => void;
}

const sortOptions: Array<{ value: SortOption; label: string; icon: React.ReactNode }> = [
  { value: 'interest', label: 'Interest', icon: <TrendingUp className="h-3 w-3" /> },
  { value: 'weekly', label: 'Weekly', icon: <Crown className="h-3 w-3" /> },
  { value: 'recent', label: 'Recent', icon: <Zap className="h-3 w-3" /> },
];

const SortFilter: React.FC<SortFilterProps> = ({ selected, onChange }) => {
  return (
    <div>
      <h3 className="text-liberation-sovereignty-gold font-semibold text-sm mb-3 uppercase tracking-wide">
        Sort By
      </h3>
      <div className="flex flex-wrap gap-2">
        {sortOptions.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              selected === value
                ? 'bg-liberation-sovereignty-gold text-black'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
            aria-pressed={selected === value}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortFilter;
