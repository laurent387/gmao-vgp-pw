import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, File, X, Eye, Trash2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Document } from '@/types';
import { documentRepository } from '@/repositories/DocumentRepository';
import { syncService } from '@/services/SyncService';

export type DocumentEntityType = 'asset' | 'report' | 'action' | 'maintenance' | 'nc';

interface DocumentPickerProps {
  entityType: DocumentEntityType;
  entityId: string;
  documents: Document[];
  onDocumentsChange: (docs: Document[]) => void;
  readOnly?: boolean;
  maxDocuments?: number;
}

export function DocumentPicker({
  entityType,
  entityId,
  documents,
  onDocumentsChange,
  readOnly = false,
  maxDocuments = 10,
}: DocumentPickerProps) {
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return true;

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'L\'accès à la caméra et à la galerie est nécessaire pour ajouter des photos.'
      );
      return false;
    }
    return true;
  };

  const processImage = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLoading(true);

    try {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      const newDoc: Document = {
        id: docId,
        entity_type: entityType,
        entity_id: entityId,
        local_uri: asset.uri,
        mime: asset.mimeType || 'image/jpeg',
        sha256: null,
        uploaded_at: now,
        synced: false,
        server_url: null,
      };

      if (Platform.OS !== 'web') {
        await documentRepository.create(newDoc);
        await syncService.addToOutbox('UPLOAD_DOCUMENT', {
          documentId: docId,
          entityType,
          entityId,
        });
      }

      onDocumentsChange([...documents, newDoc]);
      console.log('[DocumentPicker] Added document:', docId);
    } catch (e) {
      console.error('[DocumentPicker] Error adding document:', e);
      Alert.alert('Erreur', 'Impossible d\'ajouter le document');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (documents.length >= maxDocuments) {
      Alert.alert('Limite atteinte', `Maximum ${maxDocuments} documents autorisés`);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      await processImage(result);
    } catch (e) {
      console.error('[DocumentPicker] Camera error:', e);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra');
    }
  };

  const pickFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const remaining = maxDocuments - documents.length;
    if (remaining <= 0) {
      Alert.alert('Limite atteinte', `Maximum ${maxDocuments} documents autorisés`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: remaining > 1,
        selectionLimit: remaining,
      });

      if (result.canceled || !result.assets) return;

      setLoading(true);
      const newDocs: Document[] = [];

      for (const asset of result.assets) {
        const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();

        const newDoc: Document = {
          id: docId,
          entity_type: entityType,
          entity_id: entityId,
          local_uri: asset.uri,
          mime: asset.mimeType || 'image/jpeg',
          sha256: null,
          uploaded_at: now,
          synced: false,
          server_url: null,
        };

        if (Platform.OS !== 'web') {
          await documentRepository.create(newDoc);
          await syncService.addToOutbox('UPLOAD_DOCUMENT', {
            documentId: docId,
            entityType,
            entityId,
          });
        }

        newDocs.push(newDoc);
      }

      onDocumentsChange([...documents, ...newDocs]);
      console.log('[DocumentPicker] Added', newDocs.length, 'documents');
      setLoading(false);
    } catch (e) {
      console.error('[DocumentPicker] Library error:', e);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
      setLoading(false);
    }
  };

  const removeDocument = (docId: string) => {
    Alert.alert(
      'Supprimer le document',
      'Êtes-vous sûr de vouloir supprimer ce document ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                await documentRepository.delete(docId);
              }
              onDocumentsChange(documents.filter((d) => d.id !== docId));
              console.log('[DocumentPicker] Removed document:', docId);
            } catch (e) {
              console.error('[DocumentPicker] Error removing document:', e);
            }
          },
        },
      ]
    );
  };

  const getImageUri = (doc: Document): string => {
    if (doc.server_url) {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      return doc.server_url.startsWith('http') ? doc.server_url : `${baseUrl}${doc.server_url}`;
    }
    return doc.local_uri;
  };

  return (
    <View style={styles.container}>
      {!readOnly && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto} disabled={loading}>
            <Camera size={20} color={colors.primary} />
            <Text style={styles.actionText}>Prendre photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={pickFromLibrary} disabled={loading}>
            <ImagePlus size={20} color={colors.primary} />
            <Text style={styles.actionText}>Galerie</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Traitement...</Text>
        </View>
      )}

      {documents.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.documentsScroll}>
          <View style={styles.documentsContainer}>
            {documents.map((doc) => (
              <View key={doc.id} style={styles.documentItem}>
                <TouchableOpacity onPress={() => setPreviewUri(getImageUri(doc))}>
                  <Image source={{ uri: getImageUri(doc) }} style={styles.thumbnail} />
                  {!doc.synced && (
                    <View style={styles.syncBadge}>
                      <Text style={styles.syncBadgeText}>⏳</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.documentActions}>
                  <TouchableOpacity style={styles.documentAction} onPress={() => setPreviewUri(getImageUri(doc))}>
                    <Eye size={14} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {!readOnly && (
                    <TouchableOpacity style={styles.documentAction} onPress={() => removeDocument(doc.id)}>
                      <Trash2 size={14} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <File size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aucun document</Text>
        </View>
      )}

      <Modal visible={!!previewUri} transparent animationType="fade">
        <View style={styles.previewModal}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewUri(null)}>
            <X size={24} color={colors.textInverse} />
          </TouchableOpacity>

          {previewUri && (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

interface DocumentListProps {
  entityType: DocumentEntityType;
  entityId: string;
  readOnly?: boolean;
}

export function DocumentList({ entityType, entityId, readOnly = false }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadDocuments();
  }, [entityType, entityId]);

  const loadDocuments = async () => {
    try {
      const docs = await documentRepository.getByEntity(entityType, entityId);
      setDocuments(docs);
    } catch (e) {
      console.error('[DocumentList] Error loading documents:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <DocumentPicker
      entityType={entityType}
      entityId={entityId}
      documents={documents}
      onDocumentsChange={setDocuments}
      readOnly={readOnly}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  actionText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
  },
  documentsScroll: {
    marginHorizontal: -spacing.sm,
  },
  documentsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  documentItem: {
    width: 80,
    gap: spacing.xs,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
  },
  syncBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.warning,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadgeText: {
    fontSize: 10,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  documentAction: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});
