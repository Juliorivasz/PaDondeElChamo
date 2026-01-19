import type { UploadImageResponse } from "../types/upload";
import apiClient from "./interceptors/apiClient";

export const uploadImageApi = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
