import { getCategoryColor, getCategoryIcon } from '../i18n/translations';

export const DEFAULT_CATEGORIES = [
  { id: 'default-food', name: 'Food & Dining', icon: '🍔', isCustom: false },
  { id: 'default-transport', name: 'Transportation', icon: '🚗', isCustom: false },
  { id: 'default-entertainment', name: 'Entertainment', icon: '🎬', isCustom: false },
  { id: 'default-shopping', name: 'Shopping', icon: '🛍️', isCustom: false },
  { id: 'default-bills', name: 'Bills & Utilities', icon: '💡', isCustom: false },
  { id: 'default-health', name: 'Health & Fitness', icon: '⚕️', isCustom: false },
  { id: 'default-education', name: 'Education', icon: '📚', isCustom: false },
  { id: 'default-travel', name: 'Travel', icon: '✈️', isCustom: false },
  { id: 'default-other', name: 'Other', icon: '📌', isCustom: false },
];

/** Merge DB categories with defaults — always returns full list for the UI */
export function mergeCategories(dbCategories = []) {
  const map = new Map();

  DEFAULT_CATEGORIES.forEach((cat) => {
    map.set(cat.name.toLowerCase(), {
      ...cat,
      color: getCategoryColor(cat.name),
    });
  });

  (dbCategories || []).forEach((c) => {
    if (!c?.name) return;
    const key = c.name.trim().toLowerCase();
    map.set(key, {
      ...c,
      name: c.name.trim(),
      icon: c.icon || getCategoryIcon(c.name),
      color: getCategoryColor(c.name),
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}
