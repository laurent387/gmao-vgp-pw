import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Package,
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { Client, UserRole } from '@/types';
import {
  canViewClientField,
  canViewAdminSection,
  canEditClient,
  getClientStatusInfo,
  ClientField,
} from '@/utils/clientPermissions';

interface ClientSheetProps {
  /** Client data to display */
  client: Client;
  /** Current user's role for permission checks */
  userRole: UserRole;
  /** Variant: 'compact' for list items, 'full' for detail view */
  variant?: 'compact' | 'full';
  /** Callback when the card is pressed (for compact variant) */
  onPress?: () => void;
  /** Callback when edit is pressed (full variant, if permitted) */
  onEdit?: () => void;
  /** Callback to view client's assets */
  onViewAssets?: () => void;
  /** Callback to view client's reports */
  onViewReports?: () => void;
  /** Show loading state */
  isLoading?: boolean;
}

/**
 * Reusable client sheet component with role-based field visibility
 */
export function ClientSheet({
  client,
  userRole,
  variant = 'compact',
  onPress,
  onEdit,
  onViewAssets,
  onViewReports,
  isLoading = false,
}: ClientSheetProps) {
  const statusInfo = getClientStatusInfo(client.status);
  const canEdit = canEditClient(userRole);
  const showAdminSection = canViewAdminSection(userRole);

  // Helper to check field visibility
  const canView = (field: ClientField) => canViewClientField(userRole, field);

  // Action handlers
  const handleCall = () => {
    if (client.contact_phone) {
      Linking.openURL(`tel:${client.contact_phone}`);
    }
  };

  const handleEmail = () => {
    if (client.contact_email) {
      Linking.openURL(`mailto:${client.contact_email}`);
    }
  };

  const handleOpenMaps = () => {
    if (client.address) {
      const encoded = encodeURIComponent(client.address);
      const url = Platform.select({
        ios: `maps:0,0?q=${encoded}`,
        android: `geo:0,0?q=${encoded}`,
        web: `https://maps.google.com/?q=${encoded}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  // Compact variant - for list items
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <View style={styles.compactHeader}>
          <View style={styles.compactIcon}>
            <Building2 size={20} color={colors.primary} />
          </View>
          <View style={styles.compactContent}>
            <View style={styles.compactTitleRow}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {client.name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
            
            {canView('contact_name') && client.contact_name && (
              <View style={styles.compactRow}>
                <User size={14} color={colors.textMuted} />
                <Text style={styles.compactSubtitle}>{client.contact_name}</Text>
              </View>
            )}
            
            {canView('contact_phone') && client.contact_phone && (
              <View style={styles.compactRow}>
                <Phone size={14} color={colors.textMuted} />
                <Text style={styles.compactSubtitle}>{client.contact_phone}</Text>
              </View>
            )}

            {canView('asset_count') && client.asset_count !== undefined && (
              <View style={styles.compactRow}>
                <Package size={14} color={colors.textMuted} />
                <Text style={styles.compactSubtitle}>
                  {client.asset_count} équipement{client.asset_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          
          {onPress && (
            <ChevronRight size={20} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Full variant - for detail view
  return (
    <View style={styles.fullContainer}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <Building2 size={32} color={colors.surface} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.clientName}>{client.name}</Text>
          <View style={[styles.statusBadgeLarge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusTextLarge, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          {canView('id') && (
            <Text style={styles.clientId}>ID: {client.id.slice(0, 8)}...</Text>
          )}
        </View>
        {canEdit && onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Edit2 size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        
        {canView('contact_name') && client.contact_name && (
          <View style={styles.fieldRow}>
            <User size={18} color={colors.textMuted} />
            <Text style={styles.fieldLabel}>Contact principal</Text>
            <Text style={styles.fieldValue}>{client.contact_name}</Text>
          </View>
        )}

        {canView('contact_phone') && client.contact_phone && (
          <TouchableOpacity style={styles.fieldRow} onPress={handleCall}>
            <Phone size={18} color={colors.primary} />
            <Text style={styles.fieldLabel}>Téléphone</Text>
            <Text style={[styles.fieldValue, styles.linkText]}>{client.contact_phone}</Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        )}

        {canView('contact_email') && client.contact_email && (
          <TouchableOpacity style={styles.fieldRow} onPress={handleEmail}>
            <Mail size={18} color={colors.primary} />
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={[styles.fieldValue, styles.linkText]} numberOfLines={1}>
              {client.contact_email}
            </Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        )}

        {!client.contact_name && !client.contact_phone && !client.contact_email && (
          <View style={styles.emptyState}>
            <AlertCircle size={16} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucune information de contact</Text>
          </View>
        )}
      </View>

      {/* Address Section */}
      {canView('address') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse</Text>
          
          {client.address ? (
            <TouchableOpacity style={styles.addressCard} onPress={handleOpenMaps}>
              <MapPin size={18} color={colors.primary} />
              <View style={styles.addressContent}>
                <Text style={styles.addressText}>{client.address}</Text>
              </View>
              <ExternalLink size={14} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyState}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.emptyText}>Adresse non renseignée</Text>
            </View>
          )}

          {canView('access_instructions') && client.access_instructions && (
            <View style={styles.instructionsCard}>
              <AlertCircle size={16} color={colors.warning} />
              <View style={styles.instructionsContent}>
                <Text style={styles.instructionsTitle}>Consignes d'accès</Text>
                <Text style={styles.instructionsText}>{client.access_instructions}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activité</Text>
        <View style={styles.statsRow}>
          {canView('asset_count') && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={onViewAssets}
              disabled={!onViewAssets}
            >
              <Package size={24} color={colors.primary} />
              <Text style={styles.statValue}>{client.asset_count ?? 0}</Text>
              <Text style={styles.statLabel}>Équipements</Text>
            </TouchableOpacity>
          )}

          {canView('last_report_date') && (
            <TouchableOpacity
              style={styles.statCard}
              onPress={onViewReports}
              disabled={!onViewReports}
            >
              <Calendar size={24} color={colors.success} />
              <Text style={styles.statValue}>
                {client.last_report_date
                  ? new Date(client.last_report_date).toLocaleDateString('fr-FR')
                  : '-'}
              </Text>
              <Text style={styles.statLabel}>Dernier rapport</Text>
            </TouchableOpacity>
          )}

          {canView('next_due_date') && (
            <View style={styles.statCard}>
              <Clock size={24} color={client.next_due_date ? colors.warning : colors.textMuted} />
              <Text style={styles.statValue}>
                {client.next_due_date
                  ? new Date(client.next_due_date).toLocaleDateString('fr-FR')
                  : '-'}
              </Text>
              <Text style={styles.statLabel}>Prochaine échéance</Text>
            </View>
          )}
        </View>
      </View>

      {/* Admin Section - Only visible to ADMIN/HSE_MANAGER */}
      {showAdminSection && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations administratives</Text>
          
          {canView('siret') && (
            <View style={styles.fieldRow}>
              <FileText size={18} color={colors.textMuted} />
              <Text style={styles.fieldLabel}>SIRET</Text>
              <Text style={styles.fieldValue}>{client.siret || '-'}</Text>
            </View>
          )}

          {canView('tva_number') && (
            <View style={styles.fieldRow}>
              <FileText size={18} color={colors.textMuted} />
              <Text style={styles.fieldLabel}>N° TVA</Text>
              <Text style={styles.fieldValue}>{client.tva_number || '-'}</Text>
            </View>
          )}

          {canView('billing_email') && (
            <View style={styles.fieldRow}>
              <Mail size={18} color={colors.textMuted} />
              <Text style={styles.fieldLabel}>Email facturation</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {client.billing_email || '-'}
              </Text>
            </View>
          )}

          {canView('billing_address') && client.billing_address && (
            <View style={styles.fieldRowMultiline}>
              <MapPin size={18} color={colors.textMuted} />
              <View style={styles.fieldMultilineContent}>
                <Text style={styles.fieldLabel}>Adresse facturation</Text>
                <Text style={styles.fieldValueMultiline}>{client.billing_address}</Text>
              </View>
            </View>
          )}

          {canView('internal_notes') && client.internal_notes && (
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <AlertCircle size={16} color={colors.info} />
                <Text style={styles.notesTitle}>Notes internes</Text>
              </View>
              <Text style={styles.notesText}>{client.internal_notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Created date */}
      {canView('created_at') && (
        <Text style={styles.createdAt}>
          Client depuis le {new Date(client.created_at).toLocaleDateString('fr-FR')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact variant styles
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  compactContent: {
    flex: 1,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  compactSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Full variant styles
  fullContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    overflow: 'hidden',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  clientName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 4,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusTextLarge: {
    fontSize: 12,
    fontWeight: '600',
  },
  clientId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section styles
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  // Field row styles
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 120,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  linkText: {
    color: colors.primary,
  },
  fieldRowMultiline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  fieldMultilineContent: {
    flex: 1,
  },
  fieldValueMultiline: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Address card
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
  },

  // Instructions card
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.text,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    padding: spacing.md,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Notes card
  notesCard: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
  },
  notesText: {
    fontSize: 13,
    color: colors.text,
  },

  // Created at
  createdAt: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.md,
  },
});

export default ClientSheet;
