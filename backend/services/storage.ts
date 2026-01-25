import { mkdir, writeFile, readFile, unlink, stat, access } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  PDF: 20 * 1024 * 1024, // 20MB
  IMAGE: 8 * 1024 * 1024, // 8MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  PDF: ["application/pdf"],
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};

export interface StorageResult {
  storageKey: string;
  checksum: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageConfig {
  maxSizePdf?: number;
  maxSizeImage?: number;
}

class StorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = UPLOADS_DIR;
  }

  async init(): Promise<void> {
    await mkdir(this.uploadsDir, { recursive: true });
    console.log("[STORAGE] Initialized uploads directory:", this.uploadsDir);
  }

  /**
   * Generate storage key based on owner type and category
   */
  generateStorageKey(
    ownerType: string,
    ownerId: string,
    category: string,
    fileId: string,
    extension: string
  ): string {
    const cleanExt = extension.replace(/^\./, "").toLowerCase();
    return `${ownerType.toLowerCase()}/${ownerId}/${category.toLowerCase()}/${fileId}.${cleanExt}`;
  }

  /**
   * Get the full disk path for a storage key
   */
  getDiskPath(storageKey: string): string {
    const safePath = storageKey.replace(/\.\./g, "");
    return path.join(this.uploadsDir, safePath);
  }

  /**
   * Store a file from a buffer
   */
  async putObject(
    buffer: Buffer,
    storageKey: string,
    mimeType: string
  ): Promise<StorageResult> {
    const diskPath = this.getDiskPath(storageKey);
    const dirPath = path.dirname(diskPath);

    // Create directory structure
    await mkdir(dirPath, { recursive: true });

    // Calculate checksum
    const checksum = createHash("sha256").update(buffer).digest("hex");

    // Write file
    await writeFile(diskPath, buffer);

    console.log("[STORAGE] Stored file:", {
      storageKey,
      diskPath,
      size: buffer.length,
      checksum: checksum.substring(0, 16) + "...",
    });

    return {
      storageKey,
      checksum,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  /**
   * Get a file as buffer
   */
  async getObject(storageKey: string): Promise<Buffer | null> {
    const diskPath = this.getDiskPath(storageKey);

    try {
      await access(diskPath);
      return await readFile(diskPath);
    } catch {
      console.warn("[STORAGE] File not found:", storageKey);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  async exists(storageKey: string): Promise<boolean> {
    const diskPath = this.getDiskPath(storageKey);
    try {
      await access(diskPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getStats(storageKey: string): Promise<{ size: number } | null> {
    const diskPath = this.getDiskPath(storageKey);
    try {
      const stats = await stat(diskPath);
      return { size: stats.size };
    } catch {
      return null;
    }
  }

  /**
   * Delete a file
   */
  async deleteObject(storageKey: string): Promise<boolean> {
    const diskPath = this.getDiskPath(storageKey);

    try {
      await unlink(diskPath);
      console.log("[STORAGE] Deleted file:", storageKey);
      return true;
    } catch (e) {
      console.warn("[STORAGE] Failed to delete file:", storageKey, e);
      return false;
    }
  }

  /**
   * Generate a signed URL (for local storage, just return the path)
   * In production with S3, this would generate a presigned URL
   */
  getSignedUrl(storageKey: string, expiresInSeconds = 3600): string {
    // For local storage, we return a path that will be handled by the server
    // In production, this could be an S3 presigned URL
    return `/api/attachments/download/${encodeURIComponent(storageKey)}`;
  }

  /**
   * Get the public URL for a file (if not private)
   */
  getPublicUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  }

  /**
   * Validate file type and size
   */
  validateFile(
    mimeType: string,
    sizeBytes: number,
    fileType: "PDF" | "IMAGE"
  ): { valid: boolean; error?: string } {
    const allowedMimes = ALLOWED_MIME_TYPES[fileType];
    const maxSize = fileType === "PDF" ? FILE_SIZE_LIMITS.PDF : FILE_SIZE_LIMITS.IMAGE;

    if (!allowedMimes.includes(mimeType)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedMimes.join(", ")}`,
      };
    }

    if (sizeBytes > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximum: ${maxMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Determine file type from MIME type
   */
  getFileTypeFromMime(mimeType: string): "PDF" | "IMAGE" | null {
    if (ALLOWED_MIME_TYPES.PDF.includes(mimeType)) return "PDF";
    if (ALLOWED_MIME_TYPES.IMAGE.includes(mimeType)) return "IMAGE";
    return null;
  }

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
    };
    return mimeToExt[mimeType] || "bin";
  }
}

export const storageService = new StorageService();
