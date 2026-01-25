import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';

export interface Column<T> {
  key: keyof T;
  title: string;
  width?: number; // percentage or pixels
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export type SortOrder = 'asc' | 'desc' | null;

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onRowPress?: (row: T) => void;
  onSort?: (key: string, order: SortOrder) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowPress,
  onSort,
  loading,
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const handleSort = (key: string) => {
    if (!onSort) return;

    let newOrder: SortOrder = 'asc';
    if (sortBy === key) {
      if (sortOrder === 'asc') newOrder = 'desc';
      else if (sortOrder === 'desc') newOrder = null;
    }

    setSortBy(newOrder ? key : null);
    setSortOrder(newOrder);
    onSort(key, newOrder);
  };

  return (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
      <View style={styles.tableWrapper}>
        {/* Header */}
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <TouchableOpacity
              key={String(col.key)}
              style={[
                styles.headerCell,
                { flex: col.width ? 0 : 1, width: col.width },
              ]}
              onPress={() => col.sortable && handleSort(String(col.key))}
              disabled={!col.sortable}
            >
              <View style={styles.headerContent}>
                <Text
                  style={[
                    styles.headerText,
                    { textAlign: col.align || 'left' },
                  ]}
                  numberOfLines={1}
                >
                  {col.title}
                </Text>
                {col.sortable && sortBy === String(col.key) && (
                  <View style={styles.sortIcon}>
                    {sortOrder === 'asc' && (
                      <ChevronUp size={14} color={colors.primary} />
                    )}
                    {sortOrder === 'desc' && (
                      <ChevronDown size={14} color={colors.primary} />
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rows */}
        {data.map((row, idx) => (
          <TouchableOpacity
            key={row.id}
            style={[
              styles.row,
              idx % 2 === 1 && styles.rowAlt,
              onRowPress && styles.rowHoverable,
            ]}
            onPress={() => onRowPress?.(row)}
            disabled={!onRowPress}
          >
            {columns.map((col) => (
              <View
                key={String(col.key)}
                style={[
                  styles.cell,
                  { flex: col.width ? 0 : 1, width: col.width },
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    { textAlign: col.align || 'left' },
                  ]}
                  numberOfLines={2}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] || '-')}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}

        {/* Empty state */}
        {!loading && data.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>Aucune donnée</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tableWrapper: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryDark,
  },
  headerCell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    minWidth: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    ...typography.subtitle2,
    color: colors.textInverse,
    fontWeight: '600',
  },
  sortIcon: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowAlt: {
    backgroundColor: colors.surfaceAlt,
  },
  rowHoverable: {
    // Web: add hover effect via CSS, Native: add active opacity
  },
  cell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    minWidth: 100,
  },
  cellText: {
    ...typography.body2,
    color: colors.text,
  },
  emptyRow: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textMuted,
  },
});
