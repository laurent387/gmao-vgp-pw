import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  Camera,
  ImagePlus,
  FileText,
  X,
  Eye,
  Trash2,
  Download,
  Share2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Attachment, AttachmentCategory, AttachmentOwnerType } from '@/types';
import { attachmentService } from '@/services/AttachmentService';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

// Category labels and icons
const CATEGORY_CONFIG: Record<
  AttachmentCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  PLAQUE_IDENTIFICATION: {
    label: 'Plaque d\'identification',
    icon: <Camera size={16} color={colors.primary} />,
    color: colors.primary,
  },
  DOCUMENTATION: {
    label: 'Documentation',
    icon: <FileText size={16} color={colors.info} />,
    color: colors.info,
  },
  CERTIFICAT_LEGAL: {
    label: 'Certificats légaux',
    icon: <FileText size={16} color={colors.success} />,
    color: colors.success,
  },
  RAPPORT: {
    label: 'Rapports',
    icon: <FileText size={16} color={colors.warning} />,
    color: colors.warning,
  },
  PHOTO: {
    label: 'Photos',
    icon: <ImagePlus size={16} color={colors.secondary} />,
    color: colors.secondary,
  },
  AUTRE: {
    label: 'Autres',
    icon: <FileText size={16} color={colors.textMuted} />,
    color: colors.textMuted,
  },
};

interface AttachmentManagerProps {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  showPlateSection?: boolean;
  showCategories?: AttachmentCategory[];
  allowedFileTypes?: ('IMAGE' | 'PDF')[];
  maxFiles?: number;
  onAttachmentChange?: () => void;
}

export function AttachmentManager({
  ownerType,
  ownerId,
  showPlateSection = ownerType === 'EQUIPMENT',
  showCategories = ['DOCUMENTATION', 'CERTIFICAT_LEGAL', 'PHOTO', 'AUTRE'],
  allowedFileTypes = ['IMAGE', 'PDF'],
  maxFiles = 50,
  onAttachmentChange,
}: AttachmentManagerProps) {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission(['ADMIN', 'HSE_MANAGER']);
  const canUpload = hasPermission(['ADMIN', 'HSE_MANAGER', 'TECHNICIAN']);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['PLAQUE_IDENTIFICATION']));
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory>('AUTRE');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadIsPrivate, setUploadIsPrivate] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ uri: string; name: string; mime: string } | null>(null);

  // Fetch attachments
  const {
    data: attachmentsRaw,
    isLoading,
    refetch,
  } = trpc.attachments.list.useQuery(
    { ownerType, ownerId },
    { enabled: !!ownerId }
  );

  const attachments = React.useMemo(() => {
    if (!attachmentsRaw) return [];
    return Array.isArray(attachmentsRaw) ? attachmentsRaw : (attachmentsRaw as any).json || [];
  }, [attachmentsRaw]);

  // Group attachments by category
  const groupedAttachments = React.useMemo(() => {
    const grouped: Record<AttachmentCategory, Attachment[]> = {
      PLAQUE_IDENTIFICATION: [],
      DOCUMENTATION: [],
      CERTIFICAT_LEGAL: [],
      RAPPORT: [],
      PHOTO: [],
      AUTRE: [],
    };

    for (const att of attachments) {
      const cat = att.category as AttachmentCategory;
      if (grouped[cat]) {
        grouped[cat].push(att);
      } else {
        grouped.AUTRE.push(att);
      }
    }

    return grouped;
  }, [attachments]);

  const platePhoto = groupedAttachments.PLAQUE_IDENTIFICATION[0];

  // Set auth token when user changes
  useEffect(() => {
    if (user?.token_mock) {
      attachmentService.setAuthToken(user.token_mock);
    }
  }, [user?.token_mock]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleTakePhoto = async (category: AttachmentCategory) => {
    try {
      const result = await attachmentService.takePhoto();
      if (result) {
        setPendingFile({ uri: result.uri, name: `photo_${Date.now()}.jpg`, mime: 'image/jpeg' });
        setSelectedCategory(category);
        setUploadTitle('');
        setUploadModalVisible(true);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur caméra');
    }
  };

  const handlePickImage = async (category: AttachmentCategory) => {
    try {
      const result = await attachmentService.pickImage();
      if (result) {
        setPendingFile({ uri: result.uri, name: `image_${Date.now()}.jpg`, mime: 'image/jpeg' });
        setSelectedCategory(category);
        setUploadTitle('');
        setUploadModalVisible(true);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur galerie');
    }
  };

  const handlePickPdf = async (category: AttachmentCategory) => {
    try {
      const result = await attachmentService.pickPdf();
      if (result) {
        setPendingFile({ uri: result.uri, name: result.name, mime: result.mimeType });
        setSelectedCategory(category);
        setUploadTitle(result.name.replace('.pdf', ''));
        setUploadModalVisible(true);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur sélection PDF');
    }
  };

  const handleUploadPlatePhoto = async () => {
    try {
      const result = await attachmentService.takePhoto();
      if (result) {
        setUploading(true);
        await attachmentService.uploadPlatePhoto(ownerId, result.uri);
        await refetch();
        onAttachmentChange?.();
        Alert.alert('Succès', 'Photo de plaque ajoutée');
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !uploadTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre');
      return;
    }

    setUploading(true);
    try {
      await attachmentService.upload(
        pendingFile.uri,
        pendingFile.name,
        pendingFile.mime,
        ownerType,
        ownerId,
        selectedCategory,
        uploadTitle.trim(),
        uploadIsPrivate
      );
      await refetch();
      onAttachmentChange?.();
      setUploadModalVisible(false);
      setPendingFile(null);
      setUploadTitle('');
      Alert.alert('Succès', 'Document ajouté');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      await attachmentService.downloadAndShare(attachment);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur téléchargement');
    }
  };

  const handleDelete = (attachment: Attachment) => {
    Alert.alert(
      'Supprimer le document',
      `Voulez-vous supprimer "${attachment.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await attachmentService.deleteAttachment(attachment.id);
              await refetch();
              onAttachmentChange?.();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur suppression');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (attachment: Attachment) => {
    if (attachment.file_type === 'PDF') {
      return <FileText size={24} color={colors.danger} />;
    }
    return <ImagePlus size={24} color={colors.primary} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderPlateSection = () => {
    if (!showPlateSection) return null;

    return (
      <View style={styles.plateSection}>
        <Text style={styles.sectionTitle}>Plaque d'identification</Text>
        
        {platePhoto ? (
          <View style={styles.plateContainer}>
            <TouchableOpacity onPress={() => setPreviewAttachment(platePhoto)}>
              {platePhoto.file_type === 'IMAGE' ? (
                <Image
                  source={{ uri: platePhoto.download_url }}
                  style={styles.plateImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.pdfPlaceholder}>
                  <FileText size={40} color={colors.danger} />
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.plateActions}>
              <TouchableOpacity
                style={styles.plateActionBtn}
                onPress={() => handleDownload(platePhoto)}
              >
                <Download size={18} color={colors.primary} />
                <Text style={styles.plateActionText}>Télécharger</Text>
              </TouchableOpacity>
              
              {isAdmin && (
                <>
                  <TouchableOpacity
                    style={styles.plateActionBtn}
                    onPress={handleUploadPlatePhoto}
                  >
                    <Camera size={18} color={colors.warning} />
                    <Text style={styles.plateActionText}>Remplacer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.plateActionBtn}
                    onPress={() => handleDelete(platePhoto)}
                  >
                    <Trash2 size={18} color={colors.danger} />
                    <Text style={[styles.plateActionText, { color: colors.danger }]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noPlateContainer}>
            <AlertCircle size={32} color={colors.warning} />
            <Text style={styles.noPlateText}>Aucune photo de plaque</Text>
            
            {canUpload && (
              <Button
                title="Prendre une photo"
                onPress={handleUploadPlatePhoto}
                icon={<Camera size={18} color={colors.textInverse} />}
                style={{ marginTop: spacing.md }}
                loading={uploading}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = (category: AttachmentCategory) => {
    const config = CATEGORY_CONFIG[category];
    const items = groupedAttachments[category];
    const isExpanded = expandedCategories.has(category);
    const count = items.length;

    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category)}
        >
          <View style={styles.categoryHeaderLeft}>
            {config.icon}
            <Text style={styles.categoryTitle}>{config.label}</Text>
            <View style={[styles.countBadge, { backgroundColor: config.color }]}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.textMuted} />
          ) : (
            <ChevronDown size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {items.length === 0 ? (
              <Text style={styles.emptyText}>Aucun document</Text>
            ) : (
              items.map((att) => renderAttachmentItem(att))
            )}

            {canUpload && (
              <View style={styles.addActions}>
                {allowedFileTypes.includes('IMAGE') && (
                  <>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleTakePhoto(category)}
                    >
                      <Camera size={16} color={colors.primary} />
                      <Text style={styles.addButtonText}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handlePickImage(category)}
                    >
                      <ImagePlus size={16} color={colors.primary} />
                      <Text style={styles.addButtonText}>Galerie</Text>
                    </TouchableOpacity>
                  </>
                )}
                {allowedFileTypes.includes('PDF') && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handlePickPdf(category)}
                  >
                    <FileText size={16} color={colors.primary} />
                    <Text style={styles.addButtonText}>PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderAttachmentItem = (att: Attachment) => {
    const isPdf = att.file_type === 'PDF';

    return (
      <View key={att.id} style={styles.attachmentItem}>
        <TouchableOpacity
          style={styles.attachmentPreview}
          onPress={() => setPreviewAttachment(att)}
        >
          {isPdf ? (
            <View style={styles.pdfThumbnail}>
              <FileText size={24} color={colors.danger} />
              <Text style={styles.pdfLabel}>PDF</Text>
            </View>
          ) : (
            <Image
              source={{ uri: att.download_url }}
              style={styles.imageThumbnail}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

        <View style={styles.attachmentInfo}>
          <View style={styles.attachmentTitleRow}>
            <Text style={styles.attachmentTitle} numberOfLines={1}>
              {att.title}
            </Text>
            {att.is_private && <Lock size={12} color={colors.warning} />}
          </View>
          <Text style={styles.attachmentMeta}>
            {formatFileSize(att.size_bytes)} • {new Date(att.created_at).toLocaleDateString('fr-FR')}
          </Text>
          {att.uploader_name && (
            <Text style={styles.attachmentUploader}>Par: {att.uploader_name}</Text>
          )}
        </View>

        <View style={styles.attachmentActions}>
          <TouchableOpacity
            style={styles.attachmentActionBtn}
            onPress={() => handleDownload(att)}
          >
            <Download size={18} color={colors.primary} />
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.attachmentActionBtn}
              onPress={() => handleDelete(att)}
            >
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderPlateSection()}

      {showCategories.map((cat) => renderCategorySection(cat))}

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un document</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {pendingFile && (
              <View style={styles.pendingFilePreview}>
                {pendingFile.mime.startsWith('image/') ? (
                  <Image
                    source={{ uri: pendingFile.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.pdfPreview}>
                    <FileText size={48} color={colors.danger} />
                    <Text style={styles.pdfFileName}>{pendingFile.name}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Titre *</Text>
              <TextInput
                style={styles.textInput}
                value={uploadTitle}
                onChangeText={setUploadTitle}
                placeholder="Nom du document"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Catégorie</Text>
              <View style={styles.categorySelector}>
                {showCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categorySelectorItem,
                      selectedCategory === cat && styles.categorySelectorItemActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categorySelectorText,
                        selectedCategory === cat && styles.categorySelectorTextActive,
                      ]}
                    >
                      {CATEGORY_CONFIG[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isAdmin && (
              <TouchableOpacity
                style={styles.privateToggle}
                onPress={() => setUploadIsPrivate(!uploadIsPrivate)}
              >
                {uploadIsPrivate ? (
                  <Lock size={18} color={colors.warning} />
                ) : (
                  <Unlock size={18} color={colors.textMuted} />
                )}
                <Text style={styles.privateToggleText}>
                  {uploadIsPrivate ? 'Document privé (admin uniquement)' : 'Document visible par tous'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                onPress={() => setUploadModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Ajouter"
                onPress={handleConfirmUpload}
                loading={uploading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={!!previewAttachment}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewAttachment(null)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewAttachment(null)}
          >
            <X size={32} color={colors.textInverse} />
          </TouchableOpacity>

          {previewAttachment && (
            <>
              {previewAttachment.file_type === 'IMAGE' ? (
                <Image
                  source={{ uri: previewAttachment.download_url }}
                  style={styles.previewFullImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.previewPdfContainer}>
                  <FileText size={64} color={colors.danger} />
                  <Text style={styles.previewPdfTitle}>{previewAttachment.title}</Text>
                  <Text style={styles.previewPdfName}>{previewAttachment.original_file_name}</Text>
                  <Button
                    title="Ouvrir le PDF"
                    onPress={() => {
                      handleDownload(previewAttachment);
                      setPreviewAttachment(null);
                    }}
                    style={{ marginTop: spacing.lg }}
                  />
                </View>
              )}

              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewActionBtn}
                  onPress={() => handleDownload(previewAttachment)}
                >
                  <Download size={24} color={colors.textInverse} />
                  <Text style={styles.previewActionText}>Télécharger</Text>
                </TouchableOpacity>

                {isAdmin && (
                  <TouchableOpacity
                    style={styles.previewActionBtn}
                    onPress={() => {
                      handleDelete(previewAttachment);
                      setPreviewAttachment(null);
                    }}
                  >
                    <Trash2 size={24} color={colors.danger} />
                    <Text style={[styles.previewActionText, { color: colors.danger }]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },

  // Plate section
  plateSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  plateContainer: {
    alignItems: 'center',
  },
  plateImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  plateActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  plateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  plateActionText: {
    ...typography.caption,
    color: colors.primary,
  },
  noPlateContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  noPlateText: {
    ...typography.body,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  pdfPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Category sections
  categorySection: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTitle: {
    ...typography.subtitle,
  },
  countBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  categoryContent: {
    padding: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.md,
  },

  // Add actions
  addActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Attachment item
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  attachmentPreview: {
    marginRight: spacing.md,
  },
  imageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
  },
  pdfThumbnail: {
    width: 50,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfLabel: {
    ...typography.caption,
    color: colors.danger,
    fontSize: 10,
    marginTop: 2,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  attachmentTitle: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
  },
  attachmentMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  attachmentUploader: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  attachmentActionBtn: {
    padding: spacing.sm,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
  },
  pendingFilePreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.md,
  },
  pdfPreview: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  pdfFileName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  textInput: {
    ...typography.body,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categorySelectorItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categorySelectorItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categorySelectorText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categorySelectorTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  privateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  privateToggleText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
  },

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: spacing.md,
  },
  previewFullImage: {
    width: '100%',
    height: '70%',
  },
  previewPdfContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  previewPdfTitle: {
    ...typography.h3,
    color: colors.textInverse,
    marginTop: spacing.lg,
  },
  previewPdfName: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  previewActionBtn: {
    alignItems: 'center',
  },
  previewActionText: {
    ...typography.caption,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
});

export default AttachmentManager;
