import { GetCarImageResponse } from './get-car-image.response.dto.js';

export class CreateCarImageResponse {
  imageData: GetCarImageResponse;
  uploadUrl: string;
}
