import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Request } from 'express';
import { Scope } from 'src/decorators';
import { UserId } from '../../decorators';
import { Actions } from '../../enums';
import { CustomLogger } from '../logger';
import * as dto from './settings.dto';
import { SettingsActions } from './settings.roles';
import { SettingsService } from './settings.service';

const getDefinedKeys = <T extends object>(payload: T, excludedKeys: string[] = []) =>
  Object.entries(payload as Record<string, unknown>)
    .filter(([key, value]) => value !== undefined && !excludedKeys.includes(key))
    .map(([key]) => key);

@common.Controller('v1/clients/:client_id/settings')
@swagger.ApiBearerAuth()
export class SettingsClientRulesValidationsController {
  constructor(
    private readonly service: SettingsService,
    private readonly logger: CustomLogger,
  ) {}

  @common.Post('/rules/:field_name/rules_validations/:id')
  @swagger.ApiOperation({ summary: 'Add validation rule to rule' })
  @Scope(SettingsActions.update)
  async addRuleValidationToRule(
    @common.Param('client_id') clientId: string,
    @common.Param('field_name') field_name: string,
    @common.Param('id') id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const result = await this.service.addRuleValidationToRule(field_name, id, {
      clientId,
    });

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.RULE_VALIDATION_BIND,
      description: '',
      details: {
        target: field_name,
        validation_id: id,
      },
    });

    return result;
  }

  @common.Delete('/rules/:field_name/rules_validations/:id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Remove validation rule from rule' })
  @Scope(SettingsActions.update)
  async deleteRuleValidationFromRule(
    @common.Param('client_id') clientId: string,
    @common.Param('field_name') field_name: string,
    @common.Param('id') id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteRuleValidationFromRule(field_name, id, {
      clientId,
    });

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.RULE_VALIDATION_UNBIND,
      description: '',
      details: {
        target: field_name,
        validation_id: id,
      },
    });
  }

  @common.Get('/rules_validations')
  @swagger.ApiOperation({ summary: 'Get validation rules list' })
  async getRulesValidations(@common.Param('client_id') clientId: string) {
    return this.service.getRulesValidations(undefined, false, {
      clientId,
    });
  }

  @common.Get('/rules/:field_name/rules_validations')
  @swagger.ApiOperation({ summary: 'Get validation rules for rule' })
  async getRuleValidationsByRule(
    @common.Param('client_id') clientId: string,
    @common.Param('field_name') field_name: string,
  ) {
    return this.service.getRulesValidations(field_name, false, {
      clientId,
    });
  }

  @common.Post('/rules_validations')
  @swagger.ApiOperation({ summary: 'Add validation rule' })
  @Scope(SettingsActions.update)
  async addRuleValidation(
    @common.Param('client_id') clientId: string,
    @common.Body() rule: dto.CreateRuleValidationDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    const validation = await this.service.addRuleValidation(rule, {
      clientId,
    });

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.RULE_VALIDATION_CREATE,
      description: '',
      details: {
        target: validation.id,
        changed_fields: getDefinedKeys(rule),
      },
    });

    return validation;
  }

  @common.Put('/rules_validations/:id')
  @swagger.ApiOperation({ summary: 'Update validation rule' })
  @Scope(SettingsActions.update)
  async updateRuleValidation(
    @common.Param('client_id') clientId: string,
    @common.Param('id') id: string,
    @common.Body() rule: dto.UpdateRuleValidationDto,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.updateRuleValidation(id, rule, {
      clientId,
    });

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.RULE_VALIDATION_UPDATE,
      description: '',
      details: {
        target: id,
        changed_fields: getDefinedKeys(rule),
      },
    });
  }

  @common.Delete('/rules_validations/:id')
  @common.HttpCode(common.HttpStatus.NO_CONTENT)
  @swagger.ApiOperation({ summary: 'Delete validation rule' })
  @Scope(SettingsActions.update)
  async deleteRuleValidation(
    @common.Param('client_id') clientId: string,
    @common.Param('id') id: string,
    @UserId() userId: string,
    @common.Req() req: Request,
  ) {
    await this.service.deleteRuleValidation(id, {
      clientId,
    });

    await this.logger.logEvent({
      ip_address: req.ip,
      device: req.headers['user-agent'],
      user_id: userId,
      client_id: clientId,
      event: Actions.RULE_VALIDATION_DELETE,
      description: '',
      details: {
        target: id,
      },
    });
  }
}
