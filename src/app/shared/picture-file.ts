export const PICTURE_ACCEPT = 'image/jpeg,image/png,image/webp';

const PICTURE_TYPES = PICTURE_ACCEPT.split(',');
const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

export function pictureFileError(file: File): string | null {
  if (!PICTURE_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG or WebP picture';
  }
  if (file.size > MAX_PICTURE_BYTES) {
    return 'The picture must be 5 MB or smaller';
  }
  return null;
}
