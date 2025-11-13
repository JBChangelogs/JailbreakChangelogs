/**
 * Client-side file validation utilities
 * Provides helpful warnings while keeping authoritative validation on the backend
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates file extension and MIME type with helpful user warnings
 * @param file - The file to validate
 * @param allowedExtensions - Array of allowed file extensions
 * @param allowedMimeTypes - Array of allowed MIME types
 * @returns Validation result with error or warning messages
 */
export function validateFileType(
  file: File,
  allowedExtensions: string[],
  allowedMimeTypes: string[],
): FileValidationResult {
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  // Check file extension first
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file extension. Only ${allowedExtensions.join(", ")} files are allowed. You may have selected the wrong file.`,
    };
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Only ${allowedMimeTypes.join(", ")} files are allowed for upload.`,
    };
  }

  // Warn about potential file type mismatch
  const extensionMimeMap: Record<string, string[]> = {
    ".jpg": ["image/jpeg", "image/jpg"],
    ".jpeg": ["image/jpeg", "image/jpg"],
    ".png": ["image/png"],
    ".gif": ["image/gif"],
  };

  const expectedMimeTypes = extensionMimeMap[fileExtension];
  if (expectedMimeTypes && !expectedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Warning: File extension (${fileExtension}) doesn't match file type (${file.type}). You may have selected the wrong file. Please double-check your selection.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates file size
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes
 * @param maxSizeMB - Maximum file size in MB (for display)
 * @returns Validation result
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number,
  maxSizeMB: number,
): FileValidationResult {
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive file validation combining type and size checks
 * @param file - The file to validate
 * @param allowedExtensions - Array of allowed file extensions
 * @param allowedMimeTypes - Array of allowed MIME types
 * @param maxSizeBytes - Maximum file size in bytes
 * @param maxSizeMB - Maximum file size in MB (for display)
 * @returns Validation result
 */
export function validateFile(
  file: File,
  allowedExtensions: string[],
  allowedMimeTypes: string[],
  maxSizeBytes: number,
  maxSizeMB: number,
): FileValidationResult {
  // Validate file type first
  const typeValidation = validateFileType(
    file,
    allowedExtensions,
    allowedMimeTypes,
  );
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, maxSizeBytes, maxSizeMB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
}
