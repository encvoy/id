import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { basename, dirname, relative, resolve, sep } from 'path';
import sharp from 'sharp';
import { CLIENT_ID, DOMAIN } from '../../constants';
import { prisma } from '../prisma/prisma.client';

export const BRANDING_ICON_SIZES = [32, 180, 192, 512] as const;
export type BrandingIconSize = (typeof BRANDING_ICON_SIZES)[number];

const PUBLIC_ROOT = resolve(__dirname, '../../../public');
const CLIENT_IMAGES_ROOT = resolve(PUBLIC_ROOT, 'images/client');
const GENERATED_IMAGES_ROOT = resolve(CLIENT_IMAGES_ROOT, 'branding');
const DEFAULT_ICON_REFERENCE = 'public/default/logo.png';
const DEFAULT_ICON_PATH = resolve(PUBLIC_ROOT, 'default/logo.png');

type TBrandingIconSource = {
  reference: string;
  path: string;
};

@Injectable()
export class BrandingIconsService {
  private readonly pendingGenerations = new Map<string, Promise<void>>();

  isSupportedSize(size: number): size is BrandingIconSize {
    return BRANDING_ICON_SIZES.includes(size as BrandingIconSize);
  }

  async getSystemIconUrl(size: BrandingIconSize): Promise<string> {
    const client = await prisma.client.findUnique({
      where: { client_id: CLIENT_ID },
      select: { avatar: true },
    });
    const source = await this.resolveExistingSource(client?.avatar);

    await this.ensureIcon(source, size);

    return this.getPublicIconUrl(source.reference, size);
  }

  async generateVariantsForAvatar(avatar: string): Promise<void> {
    const source = this.resolveClientSource(avatar);
    await this.assertFileExists(source.path);
    await Promise.all(BRANDING_ICON_SIZES.map((size) => this.ensureIcon(source, size)));
  }

  async deleteVariantsForAvatar(avatar?: string | null): Promise<void> {
    if (!avatar) {
      return;
    }

    const reference = this.getClientAvatarReference(avatar);
    if (!reference) {
      return;
    }

    const variantsPath = this.getVariantsPath(reference);
    try {
      await fs.rm(variantsPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to delete generated client branding icons:', error);
    }
  }

  private async resolveExistingSource(avatar?: string | null): Promise<TBrandingIconSource> {
    if (avatar) {
      try {
        const source = this.resolveClientSource(avatar);
        await this.assertFileExists(source.path);
        return source;
      } catch (error) {
        console.error('Failed to use the system client avatar for branding:', error);
      }
    }

    await this.assertFileExists(DEFAULT_ICON_PATH);
    return {
      reference: DEFAULT_ICON_REFERENCE,
      path: DEFAULT_ICON_PATH,
    };
  }

  private resolveClientSource(avatar: string): TBrandingIconSource {
    const normalizedAvatar = avatar.replace(/\\/g, '/').split(/[?#]/)[0];
    if (normalizedAvatar.endsWith(DEFAULT_ICON_REFERENCE)) {
      return {
        reference: DEFAULT_ICON_REFERENCE,
        path: DEFAULT_ICON_PATH,
      };
    }

    const reference = this.getClientAvatarReference(avatar);
    if (!reference) {
      throw new BadRequestException('Client avatar must be a local client image');
    }

    const path = resolve(PUBLIC_ROOT, reference.replace(/^public\//, ''));
    const relativePath = relative(CLIENT_IMAGES_ROOT, path);
    if (relativePath.startsWith('..') || relativePath.includes(`..${sep}`)) {
      throw new BadRequestException('Invalid client avatar path');
    }

    return { reference, path };
  }

  private getClientAvatarReference(avatar: string): string | null {
    const normalized = avatar.replace(/\\/g, '/').split('?')[0];
    const marker = 'public/images/client/';
    const markerIndex = normalized.indexOf(marker);
    if (markerIndex === -1) {
      return null;
    }

    const reference = normalized.slice(markerIndex);
    if (!basename(reference) || reference.includes('../')) {
      return null;
    }

    return reference;
  }

  private async assertFileExists(path: string): Promise<void> {
    try {
      await fs.access(path);
    } catch {
      throw new BadRequestException('Client avatar file is not available');
    }
  }

  private getSourceKey(reference: string): string {
    return createHash('sha256').update(reference).digest('hex').slice(0, 24);
  }

  private getVariantsPath(reference: string): string {
    return resolve(GENERATED_IMAGES_ROOT, this.getSourceKey(reference));
  }

  private getIconPath(reference: string, size: BrandingIconSize): string {
    return resolve(this.getVariantsPath(reference), `${size}.png`);
  }

  private getPublicIconUrl(reference: string, size: BrandingIconSize): string {
    const publicDomain = DOMAIN.replace(/\/+$/, '');
    return `${publicDomain}/public/images/client/branding/${this.getSourceKey(reference)}/${size}.png`;
  }

  private async ensureIcon(source: TBrandingIconSource, size: BrandingIconSize): Promise<void> {
    const targetPath = this.getIconPath(source.reference, size);
    try {
      await fs.access(targetPath);
      return;
    } catch {
      // Generate the missing variant below.
    }

    const generationKey = `${source.reference}:${size}`;
    const pendingGeneration = this.pendingGenerations.get(generationKey);
    if (pendingGeneration) {
      return pendingGeneration;
    }

    const generation = this.generateIcon(source.path, targetPath, size).finally(() => {
      this.pendingGenerations.delete(generationKey);
    });
    this.pendingGenerations.set(generationKey, generation);

    return generation;
  }

  private async generateIcon(
    sourcePath: string,
    targetPath: string,
    size: BrandingIconSize,
  ): Promise<void> {
    await fs.mkdir(dirname(targetPath), { recursive: true });
    const temporaryPath = `${targetPath}.${randomUUID()}.tmp`;

    try {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(temporaryPath);
      await fs.rename(temporaryPath, targetPath);
    } finally {
      await fs.unlink(temporaryPath).catch(() => undefined);
    }
  }
}
