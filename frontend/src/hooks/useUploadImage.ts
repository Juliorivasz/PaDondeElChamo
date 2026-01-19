import { useState } from 'react';
import { uploadImageApi } from '../api/uploadApi';
import type { UploadImageResponse } from '../types/upload';

export const useUploadImage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    file: File
  ): Promise<UploadImageResponse> => {
    try {
      setLoading(true);
      setError(null);
      return await uploadImageApi(file);
    } catch (err: any) {
      setError(err.message ?? 'Error al subir imagen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading, error };
};
