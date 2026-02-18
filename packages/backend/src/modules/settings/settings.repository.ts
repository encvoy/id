import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type SettingsModel = Prisma.SettingsGetPayload<{ select: Prisma.SettingsSelect }>;

@Injectable()
export class SettingsRepository {}
