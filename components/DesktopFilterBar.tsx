import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

function FilterDropdown({ label, options, value, onChange, onClear }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || label;

  return (
    <View style={styles.dropdown}>
      <TouchableOpacity
        style={[styles.dropdownButton, value && styles.dropdownButtonActive]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.dropdownButtonText, value && styles.dropdownButtonTextActive]}>
          {selectedLabel}
        </Text>
        <ChevronDown
          size={16}
          color={value ? colors.primary : colors.textMuted}
          style={isOpen && styles.dropdownIconRotated}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              onClear?.();
              setIsOpen(false);
            }}
          >
            <Text style={styles.dropdownItemText}>Tous</Text>
          </TouchableOpacity>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                value === option.value && styles.dropdownItemSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  value === option.value && styles.dropdownItemTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

interface DesktopFilterBarProps {
  filters: Record<string, FilterOption[]>;
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  onClear: (key: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function DesktopFilterBar({
  filters,
  values,
  onChange,
  onClear,
  searchValue,
  onSearchChange,
}: DesktopFilterBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onSearchChange && (
          <View style={styles.searchBox}>
            <Text style={styles.searchPlaceholder}>
              {searchValue || 'Rechercher...'}
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filterRow}>
            {Object.entries(filters).map(([key, options]) => (
              <FilterDropdown
                key={key}
                label={key}
                options={options}
                value={values[key]}
                onChange={(value) => onChange(key, value)}
                onClear={() => onClear(key)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Active filters display */}
        {Object.entries(values).some(([, v]) => v) && (
          <View style={styles.activeFiltersRow}>
            {Object.entries(values).map(([key, value]) => (
              value && (
                <View key={key} style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>
                    {filters[key]?.find(o => o.value === value)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => onClear(key)}>
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  searchBox: {
    minWidth: 250,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    ...typography.body2,
    color: colors.textMuted,
  },
  filtersScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dropdown: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  dropdownButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dropdownButtonText: {
    ...typography.body2,
    color: colors.textMuted,
    flex: 1,
  },
  dropdownButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    minWidth: 150,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  dropdownItemText: {
    ...typography.body2,
    color: colors.text,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  activeFilterText: {
    ...typography.body3,
    color: colors.primary,
    fontWeight: '500',
  },
});
