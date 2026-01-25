import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { trpcClient } from '@/lib/trpc';
import {
  Attachment,
  AttachmentCategory,
  AttachmentOwnerType,
  AttachmentFileType,
} from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://api.in-spectra.com/api';

// File size limits (same as backend)
export const FILE_SIZE_LIMITS = {
  PDF: 20 * 1024 * 1024, // 20MB
  IMAGE: 8 * 1024 * 1024, // 8MB
};

// Image compression settings
const IMAGE_COMPRESSION = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
};

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  id: string;
  storageKey: string;
  downloadUrl: string;
  sizeBytes: number;
}

export interface AttachmentListResult {
  attachments: Attachment[];
  hasPlatePhoto: boolean;
}

class AttachmentService {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraStatus === 'granted' && libraryStatus === 'granted';
  }

  /**
   * Compress an image before upload
   */
  async compressImage(uri: string): Promise<{ uri: string; width: number; height: number }> {
    if (Platform.OS === 'web') {
      return { uri, width: 0, height: 0 };
    }

    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: IMAGE_COMPRESSION.maxWidth,
              height: IMAGE_COMPRESSION.maxHeight,
            },
          },
        ],
        {
          compress: IMAGE_COMPRESSION.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log('[AttachmentService] Image compressed:', {
        original: uri.substring(0, 50),
        compressed: result.uri.substring(0, 50),
        dimensions: `${result.width}x${result.height}`,
      });

      return result;
    } catch (e) {
      console.warn('[AttachmentService] Image compression failed, using original:', e);
      return { uri, width: 0, height: 0 };
    }
  }

  /**
   * Pick a PDF document
   */
  async pickPdf(): Promise<{ uri: string; name: string; size: number; mimeType: string } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      
      // Check file size
      if (asset.size && asset.size > FILE_SIZE_LIMITS.PDF) {
        throw new Error(`Le fichier est trop volumineux. Taille maximum: ${FILE_SIZE_LIMITS.PDF / (1024 * 1024)}MB`);
      }

      return {
        uri: asset.uri,
        name: asset.name || 'document.pdf',
        size: asset.size || 0,
        mimeType: asset.mimeType || 'application/pdf',
      };
    } catch (e) {
      console.error('[AttachmentService] PDF pick error:', e);
      throw e;
    }
  }

  /**
   * Take a photo with camera
   */
  async takePhoto(): Promise<{ uri: string; width: number; height: number } | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Permission caméra refusée');
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      
      // Compress before returning
      return this.compressImage(asset.uri);
    } catch (e) {
      console.error('[AttachmentService] Camera error:', e);
      throw e;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImage(): Promise<{ uri: string; width: number; height: number } | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Permission galerie refusée');
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      
      // Compress before returning
      return this.compressImage(asset.uri);
    } catch (e) {
      console.error('[AttachmentService] Gallery error:', e);
      throw e;
    }
  }

  /**
   * Upload a file (image or PDF)
   */
  async upload(
    fileUri: string,
    fileName: string,
    mimeType: string,
    ownerType: AttachmentOwnerType,
    ownerId: string,
    category: AttachmentCategory,
    title: string,
    isPrivate = false,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!this.authToken) {
      throw new Error('Non authentifié');
    }

    console.log('[AttachmentService] Starting upload:', {
      fileName,
      mimeType,
      ownerType,
      ownerId,
      category,
      title,
    });

    const formData = new FormData();
    formData.append('ownerType', ownerType);
    formData.append('ownerId', ownerId);
    formData.append('category', category);
    formData.append('title', title);
    formData.append('isPrivate', String(isPrivate));

    // Handle file differently for web vs native
    if (Platform.OS === 'web') {
      // For web, fetch the blob and append
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      // For native, use the uri directly
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/attachments/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[AttachmentService] Upload success:', result);

      return {
        id: result.id,
        storageKey: result.storageKey,
        downloadUrl: result.downloadUrl,
        sizeBytes: result.sizeBytes,
      };
    } catch (e) {
      console.error('[AttachmentService] Upload error:', e);
      throw e;
    }
  }

  /**
   * Upload plate photo for equipment
   */
  async uploadPlatePhoto(
    assetId: string,
    imageUri: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const compressed = await this.compressImage(imageUri);
    return this.upload(
      compressed.uri,
      `plaque_${assetId}_${Date.now()}.jpg`,
      'image/jpeg',
      'EQUIPMENT',
      assetId,
      'PLAQUE_IDENTIFICATION',
      'Plaque d\'identification',
      false,
      onProgress
    );
  }

  /**
   * Upload document to equipment
   */
  async uploadDocumentToEquipment(
    assetId: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
    category: AttachmentCategory,
    title: string,
    isPrivate = false
  ): Promise<UploadResult> {
    return this.upload(
      fileUri,
      fileName,
      mimeType,
      'EQUIPMENT',
      assetId,
      category,
      title,
      isPrivate
    );
  }

  /**
   * Upload PDF to report (admin only)
   */
  async uploadPdfToReport(
    reportId: string,
    fileUri: string,
    fileName: string,
    title?: string
  ): Promise<UploadResult> {
    return this.upload(
      fileUri,
      fileName,
      'application/pdf',
      'REPORT',
      reportId,
      'RAPPORT',
      title || 'Rapport PDF',
      false
    );
  }

  /**
   * Upload PDF to VGP report (admin only)
   */
  async uploadPdfToVgpReport(
    reportId: string,
    fileUri: string,
    fileName: string,
    title?: string
  ): Promise<UploadResult> {
    return this.upload(
      fileUri,
      fileName,
      'application/pdf',
      'VGP_REPORT',
      reportId,
      'RAPPORT',
      title || 'Rapport VGP PDF',
      false
    );
  }

  /**
   * List attachments for an owner
   */
  async listAttachments(
    ownerType: AttachmentOwnerType,
    ownerId: string,
    category?: AttachmentCategory
  ): Promise<Attachment[]> {
    try {
      const result = await trpcClient.attachments.list.query({
        ownerType,
        ownerId,
        category,
      });
      return result as Attachment[];
    } catch (e) {
      console.error('[AttachmentService] List error:', e);
      throw e;
    }
  }

  /**
   * Get attachments grouped by category
   */
  async getAttachmentsByCategory(
    ownerType: AttachmentOwnerType,
    ownerId: string
  ): Promise<Record<AttachmentCategory, Attachment[]>> {
    const all = await this.listAttachments(ownerType, ownerId);
    
    const grouped: Record<AttachmentCategory, Attachment[]> = {
      DOCUMENTATION: [],
      CERTIFICAT_LEGAL: [],
      RAPPORT: [],
      PLAQUE_IDENTIFICATION: [],
      PHOTO: [],
      AUTRE: [],
    };

    for (const att of all) {
      if (grouped[att.category as AttachmentCategory]) {
        grouped[att.category as AttachmentCategory].push(att);
      } else {
        grouped.AUTRE.push(att);
      }
    }

    return grouped;
  }

  /**
   * Check if equipment has plate photo
   */
  async hasPlatePhoto(assetId: string): Promise<boolean> {
    try {
      return await trpcClient.attachments.hasPlatePhoto.query({ assetId });
    } catch {
      return false;
    }
  }

  /**
   * Get report PDF
   */
  async getReportPdf(reportId: string): Promise<Attachment | null> {
    try {
      const result = await trpcClient.attachments.getReportPdf.query({ reportId });
      return result as Attachment | null;
    } catch {
      return null;
    }
  }

  /**
   * Download and share a file
   */
  async downloadAndShare(attachment: Attachment): Promise<void> {
    if (Platform.OS === 'web') {
      // On web, just open the URL
      const url = `${API_BASE_URL}/attachments/download/${encodeURIComponent(attachment.storage_key)}`;
      window.open(url, '_blank');
      return;
    }

    try {
      const downloadUrl = `${API_BASE_URL}/attachments/download/${encodeURIComponent(attachment.storage_key)}`;
      const fileUri = `${FileSystem.cacheDirectory}${attachment.original_file_name}`;

      // Download file
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: attachment.mime_type,
          dialogTitle: attachment.title,
        });
      } else {
        // Fallback to opening with system viewer
        await Linking.openURL(downloadResult.uri);
      }
    } catch (e) {
      console.error('[AttachmentService] Download/share error:', e);
      throw e;
    }
  }

  /**
   * Open a file for viewing
   */
  async openFile(attachment: Attachment): Promise<void> {
    if (Platform.OS === 'web') {
      const url = `${API_BASE_URL}/attachments/download/${encodeURIComponent(attachment.storage_key)}`;
      window.open(url, '_blank');
      return;
    }

    try {
      const downloadUrl = `${API_BASE_URL}/attachments/download/${encodeURIComponent(attachment.storage_key)}`;
      const fileUri = `${FileSystem.cacheDirectory}${attachment.original_file_name}`;

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        }
      );

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Open with system viewer
      await Linking.openURL(downloadResult.uri);
    } catch (e) {
      console.error('[AttachmentService] Open file error:', e);
      throw e;
    }
  }

  /**
   * Update attachment metadata
   */
  async updateAttachment(
    id: string,
    updates: { title?: string; category?: AttachmentCategory; isPrivate?: boolean }
  ): Promise<void> {
    try {
      await trpcClient.attachments.update.mutate({ id, ...updates });
    } catch (e) {
      console.error('[AttachmentService] Update error:', e);
      throw e;
    }
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(id: string, permanent = false): Promise<void> {
    try {
      await trpcClient.attachments.delete.mutate({ id, permanent });
    } catch (e) {
      console.error('[AttachmentService] Delete error:', e);
      throw e;
    }
  }
}

export const attachmentService = new AttachmentService();
