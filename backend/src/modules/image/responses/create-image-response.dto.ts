import type { GetImageResponse } from './get-image.response.dto.js';

export class CreateImageResponse {
  imageData: GetImageResponse;
  uploadUrl: string;
}
