import { generateImage } from 'ai';
import { google } from '@ai-sdk/google';
import { env } from '../../config/env';

type Operation = 'generate' | 'edit' | 'enhance';
type InputImage = { mimeType?: string; data?: string };

export class ImageService {
  async generate(operation: Operation, prompt: string, image?: InputImage) {
    if (!env.geminiApiKey) throw new Error('IMAGE_PROVIDER_NOT_CONFIGURED');
    if (operation !== 'enhance' && !prompt.trim()) throw new Error('IMAGE_PROMPT_REQUIRED');
    const text = operation === 'generate' ? prompt.trim() : `${operation === 'enhance' ? 'Enhance this image while preserving its identity, composition and important details.' : 'Edit this image according to the user request.'}\nUser request: ${prompt.trim()}`;
    const input = image?.data ? { text, images: [Buffer.from(image.data, 'base64')] } : text;
    const result = await generateImage({
      model: google.image(env.imageModel),
      prompt: input,
      aspectRatio: env.imageAspectRatio,
      providerOptions: { google: { imageConfig: { imageSize: env.imageSize } } },
      headers: { 'x-goog-api-key': env.geminiApiKey },
    });
    return { imageDataUrl: `data:${result.image.mediaType};base64,${result.image.base64}`, model: env.imageModel };
  }
}
