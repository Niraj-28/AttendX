/**
 * Image Compression Utility
 * Automatically compresses images before upload to reduce size and improve performance
 */

/**
 * Compress an image file to a target size
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width (default: 800)
 * @param {number} options.maxHeight - Maximum height (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 0.5)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeMB = 0.5,
  } = options;

  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }

            // Check if size is acceptable
            const sizeMB = blob.size / (1024 * 1024);
            
            if (sizeMB > maxSizeMB && quality > 0.1) {
              // If still too large, compress more aggressively
              const newQuality = Math.max(0.1, quality - 0.1);
              console.log(`Image still ${sizeMB.toFixed(2)}MB, reducing quality to ${newQuality}`);
              
              // Recursively compress with lower quality
              canvas.toBlob(
                (newBlob) => {
                  const compressedFile = new File(
                    [newBlob],
                    file.name,
                    { type: 'image/jpeg', lastModified: Date.now() }
                  );
                  
                  console.log(`Compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
                  resolve(compressedFile);
                },
                'image/jpeg',
                newQuality
              );
            } else {
              // Size is acceptable
              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              
              console.log(`Compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress image for student photo upload
 * Optimized for face recognition (medium size, good quality)
 * @param {File} file - Image file
 * @returns {Promise<File>} - Compressed image
 */
export const compressStudentPhoto = async (file) => {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    maxSizeMB: 0.5,
  });
};

/**
 * Compress image for attendance capture
 * Optimized for multiple faces (larger size, better quality)
 * @param {File} file - Image file
 * @returns {Promise<File>} - Compressed image
 */
export const compressAttendancePhoto = async (file) => {
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    maxSizeMB: 2,
  });
};

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, error: string}
 */
export const validateImage = async (file, options = {}) => {
  const {
    maxSizeMB = 10,
    minWidth = 100,
    minHeight = 100,
    maxWidth = 10000,
    maxHeight = 10000,
  } = options;

  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check dimensions
  try {
    const { width, height } = await getImageDimensions(file);
    
    if (width < minWidth || height < minHeight) {
      return { valid: false, error: `Image must be at least ${minWidth}x${minHeight}px` };
    }

    if (width > maxWidth || height > maxHeight) {
      return { valid: false, error: `Image must be at most ${maxWidth}x${maxHeight}px` };
    }

    return { valid: true, dimensions: { width, height } };
  } catch (error) {
    return { valid: false, error: 'Failed to read image' };
  }
};

export default {
  compressImage,
  compressStudentPhoto,
  compressAttendancePhoto,
  getImageDimensions,
  validateImage,
};
