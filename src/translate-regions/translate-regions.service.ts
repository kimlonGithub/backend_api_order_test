import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTranslateRegionDto } from '../dto/create-translate-region.dto';
import { UpdateTranslateRegionDto } from '../dto/update-translate-region.dto';
import { CreateTranslateRegionLocaleDto } from '../dto/create-translate-region-locale.dto';
import { UpdateTranslateRegionLocaleDto } from '../dto/update-translate-region-locale.dto';

/** API response shape: region with supportedLocales array (frontend-friendly) */
export interface TranslateRegionResponse {
  id: string;
  name: string;
  nativeName: string;
  flagUrl: string;
  defaultLocale: string;
  isActive: boolean;
  sortOrder: number | null;
  supportedLocales: string[];
  createdAt: Date;
  updatedAt: Date;
}

function toRegionResponse(region: {
  id: string;
  name: string;
  nativeName: string;
  flagUrl: string;
  defaultLocale: string;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  locales: { localeCode: string; sortOrder: number }[];
}): TranslateRegionResponse {
  const supportedLocales = region.locales
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((l) => l.localeCode);
  return {
    id: region.id,
    name: region.name,
    nativeName: region.nativeName,
    flagUrl: region.flagUrl,
    defaultLocale: region.defaultLocale,
    isActive: region.isActive,
    sortOrder: region.sortOrder,
    supportedLocales,
    createdAt: region.createdAt,
    updatedAt: region.updatedAt,
  };
}

@Injectable()
export class TranslateRegionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(isActive?: boolean): Promise<TranslateRegionResponse[]> {
    const where = isActive !== undefined ? { isActive } : {};
    const regions = await this.prisma.translateRegion.findMany({
      where,
      include: {
        locales: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return regions.map(toRegionResponse);
  }

  async findOne(id: string): Promise<TranslateRegionResponse> {
    const region = await this.prisma.translateRegion.findUnique({
      where: { id },
      include: {
        locales: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!region) {
      throw new NotFoundException(`Translate region with id "${id}" not found`);
    }
    return toRegionResponse(region);
  }

  async create(dto: CreateTranslateRegionDto): Promise<TranslateRegionResponse> {
    const existing = await this.prisma.translateRegion.findUnique({
      where: { id: dto.id },
    });
    if (existing) {
      throw new ConflictException(
        `Translate region with id "${dto.id}" already exists`,
      );
    }

    const defaultLocaleInLocales =
      !dto.supportedLocales?.length ||
      dto.supportedLocales.some((l) => l.localeCode === dto.defaultLocale);
    if (!defaultLocaleInLocales) {
      throw new BadRequestException(
        `defaultLocale "${dto.defaultLocale}" must be one of supportedLocales`,
      );
    }

    const region = await this.prisma.translateRegion.create({
      data: {
        id: dto.id,
        name: dto.name,
        nativeName: dto.nativeName,
        flagUrl: dto.flagUrl,
        defaultLocale: dto.defaultLocale,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? null,
        locales: (() => {
          const locales = dto.supportedLocales;
          if (!locales?.length) return undefined;
          return {
            create: locales.map((l, i) => ({
              localeCode: l.localeCode,
              sortOrder: l.sortOrder ?? i,
            })),
          };
        })(),
      },
      include: {
        locales: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return toRegionResponse(region);
  }

  async update(
    id: string,
    dto: UpdateTranslateRegionDto,
  ): Promise<TranslateRegionResponse> {
    await this.findOne(id);

    if (dto.defaultLocale !== undefined) {
      const region = await this.prisma.translateRegion.findUnique({
        where: { id },
        include: { locales: true },
      });
      if (region) {
        const codes = region.locales.map((l) => l.localeCode);
        if (!codes.includes(dto.defaultLocale)) {
          throw new BadRequestException(
            `defaultLocale "${dto.defaultLocale}" must be one of supported locales: ${codes.join(', ')}`,
          );
        }
      }
    }

    const region = await this.prisma.translateRegion.update({
      where: { id },
      data: {
        name: dto.name,
        nativeName: dto.nativeName,
        flagUrl: dto.flagUrl,
        defaultLocale: dto.defaultLocale,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
      include: {
        locales: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return toRegionResponse(region);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.translateRegion.delete({
      where: { id },
    });
  }

  // --- Locales (nested under region) ---

  async findLocalesByRegionId(regionId: string) {
    await this.findOne(regionId);
    return this.prisma.translateRegionLocale.findMany({
      where: { regionId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async addLocale(
    regionId: string,
    dto: CreateTranslateRegionLocaleDto,
  ): Promise<{ regionId: string; localeCode: string; sortOrder: number }> {
    await this.findOne(regionId);

    const existing = await this.prisma.translateRegionLocale.findUnique({
      where: {
        regionId_localeCode: { regionId, localeCode: dto.localeCode },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Locale "${dto.localeCode}" already exists for region "${regionId}"`,
      );
    }

    const nextOrder =
      dto.sortOrder ??
      (await this.prisma.translateRegionLocale
        .aggregate({
          where: { regionId },
          _max: { sortOrder: true },
        })
        .then((r) => (r._max.sortOrder ?? -1) + 1));

    return this.prisma.translateRegionLocale.create({
      data: {
        regionId,
        localeCode: dto.localeCode,
        sortOrder: nextOrder,
      },
    });
  }

  async updateLocale(
    regionId: string,
    localeCode: string,
    dto: UpdateTranslateRegionLocaleDto,
  ): Promise<{ regionId: string; localeCode: string; sortOrder: number }> {
    await this.findOne(regionId);

    const existing = await this.prisma.translateRegionLocale.findUnique({
      where: {
        regionId_localeCode: { regionId, localeCode },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        `Locale "${localeCode}" not found for region "${regionId}"`,
      );
    }

    if (dto.sortOrder === undefined) {
      return existing;
    }

    return this.prisma.translateRegionLocale.update({
      where: {
        regionId_localeCode: { regionId, localeCode },
      },
      data: { sortOrder: dto.sortOrder },
    });
  }

  async removeLocale(regionId: string, localeCode: string): Promise<void> {
    await this.findOne(regionId);

    const existing = await this.prisma.translateRegionLocale.findUnique({
      where: {
        regionId_localeCode: { regionId, localeCode },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        `Locale "${localeCode}" not found for region "${regionId}"`,
      );
    }

    const region = await this.prisma.translateRegion.findUnique({
      where: { id: regionId },
      include: { locales: true },
    });
    if (region?.defaultLocale === localeCode) {
      throw new BadRequestException(
        `Cannot remove default locale "${localeCode}" from region. Update defaultLocale first.`,
      );
    }

    await this.prisma.translateRegionLocale.delete({
      where: {
        regionId_localeCode: { regionId, localeCode },
      },
    });
  }
}
