import React from 'react';
import type { ArticleCategory } from '@/types/newsroom';

interface CategoryFilterProps {
  selected: ArticleCategory | 'all';
  onChange: (category: ArticleCategory | 'all') => void;
}

const categories: Array<ArticleCategory | 'all'> = [
  'all',
  'liberation',
  'community',
  'politics',
  'culture',
  'economics',
  'health',
  'technology',
  'opinion',
];

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selected, onChange }) => {
  return (
    <div>
      <h3 className="text-liberation-sovereignty-gold font-semibold text-sm mb-3 uppercase tracking-wide">
        Categories
      </h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              selected === category
                ? 'bg-liberation-sovereignty-gold text-black'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
            aria-pressed={selected === category}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
