import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TranslateRegionsService } from './translate-regions.service';
import { CreateTranslateRegionDto } from '../dto/create-translate-region.dto';
import { UpdateTranslateRegionDto } from '../dto/update-translate-region.dto';
import { CreateTranslateRegionLocaleDto } from '../dto/create-translate-region-locale.dto';
import { UpdateTranslateRegionLocaleDto } from '../dto/update-translate-region-locale.dto';

@ApiTags('Translate Regions')
@Controller('translate-regions')
export class TranslateRegionsController {
  constructor(private readonly translateRegionsService: TranslateRegionsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a translate region (optionally with locales)' })
  @ApiResponse({ status: 201, description: 'Region created.' })
  @ApiResponse({ status: 409, description: 'Region id already exists.' })
  @ApiResponse({ status: 400, description: 'defaultLocale not in supportedLocales.' })
  create(@Body() createTranslateRegionDto: CreateTranslateRegionDto) {
    return this.translateRegionsService.create(createTranslateRegionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List translate regions (optional filter by isActive)' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active state (e.g. ?isActive=true for translate UI)',
  })
  @ApiResponse({ status: 200, description: 'List of regions with supportedLocales.' })
  findAll(@Query('isActive') isActive?: string) {
    const active =
      isActive === undefined
        ? undefined
        : isActive === 'true'
          ? true
          : isActive === 'false'
            ? false
            : undefined;
    return this.translateRegionsService.findAll(active);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a translate region by id' })
  @ApiParam({ name: 'id', type: String, description: 'Region code (e.g. th, asia)' })
  @ApiResponse({ status: 200, description: 'Region with supportedLocales.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  findOne(@Param('id') id: string) {
    return this.translateRegionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a translate region' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Region updated.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  @ApiResponse({ status: 400, description: 'defaultLocale not in supported locales.' })
  update(
    @Param('id') id: string,
    @Body() updateTranslateRegionDto: UpdateTranslateRegionDto,
  ) {
    return this.translateRegionsService.update(id, updateTranslateRegionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a translate region (cascades to locales)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Region deleted.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  remove(@Param('id') id: string) {
    return this.translateRegionsService.remove(id);
  }

  // --- Nested: locales for a region ---

  @Get(':regionId/locales')
  @ApiOperation({ summary: 'List locales for a region' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiResponse({ status: 200, description: 'List of locale rows (regionId, localeCode, sortOrder).' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  findLocales(@Param('regionId') regionId: string) {
    return this.translateRegionsService.findLocalesByRegionId(regionId);
  }

  @Post(':regionId/locales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a locale to a region' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiResponse({ status: 201, description: 'Locale added.' })
  @ApiResponse({ status: 404, description: 'Region not found.' })
  @ApiResponse({ status: 409, description: 'Locale already exists for region.' })
  addLocale(
    @Param('regionId') regionId: string,
    @Body() createLocaleDto: CreateTranslateRegionLocaleDto,
  ) {
    return this.translateRegionsService.addLocale(regionId, createLocaleDto);
  }

  @Patch(':regionId/locales/:localeCode')
  @ApiOperation({ summary: 'Update a region locale (e.g. sortOrder)' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiParam({ name: 'localeCode', type: String })
  @ApiResponse({ status: 200, description: 'Locale updated.' })
  @ApiResponse({ status: 404, description: 'Region or locale not found.' })
  updateLocale(
    @Param('regionId') regionId: string,
    @Param('localeCode') localeCode: string,
    @Body() updateLocaleDto: UpdateTranslateRegionLocaleDto,
  ) {
    return this.translateRegionsService.updateLocale(
      regionId,
      localeCode,
      updateLocaleDto,
    );
  }

  @Delete(':regionId/locales/:localeCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a locale from a region' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiParam({ name: 'localeCode', type: String })
  @ApiResponse({ status: 204, description: 'Locale removed.' })
  @ApiResponse({ status: 404, description: 'Region or locale not found.' })
  @ApiResponse({ status: 400, description: 'Cannot remove default locale.' })
  removeLocale(
    @Param('regionId') regionId: string,
    @Param('localeCode') localeCode: string,
  ) {
    return this.translateRegionsService.removeLocale(regionId, localeCode);
  }
}
