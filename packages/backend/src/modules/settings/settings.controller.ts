import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { Role, Scope } from 'src/decorators';
import { UserRoles } from '../../enums';
import * as dto from './settings.dto';
import { SettingsActions } from './settings.roles';
import { SettingsService } from './settings.service';
import { NotificationAction } from '../providers/collection/email/email.types';

@common.Controller('v1/settings')
@swagger.ApiBasicAuth()
@swagger.ApiBearerAuth()
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  //#region settings
  @common.Get('')
  @swagger.ApiOperation({ summary: 'Get Trusted settings' })
  async getSettings(@Role() role: UserRoles) {
    return this.service.getSettings(role);
  }

  @common.Put('')
  @swagger.ApiOperation({ summary: 'Update Trusted settings' })
  @Scope(SettingsActions.update)
  async changeSettings(@common.Body() editSettingsDto: dto.EditSettingsDto) {
    await this.service.changeSettings(editSettingsDto);
  }
  //#endregion

  //#region email_templates
  @common.Get('/email_templates')
  @swagger.ApiOperation({ summary: 'Get email templates list' })
  @Scope(SettingsActions.update)
  async getEmailTemplates() {
    return this.service.getEmailTemplates();
  }

  @common.Put('/email_templates/:action')
  @swagger.ApiOperation({ summary: 'Update email template settings' })
  @Scope(SettingsActions.update)
  async updateEmailTemplate(
    @common.Param('action', new common.ParseEnumPipe(NotificationAction))
    action: NotificationAction,
    @common.Body() params: dto.UpdateEmailTemplateDto,
  ) {
    return this.service.updateEmailTemplate(action, params);
  }

  //#endregion

  //#region profile_fields
  @common.Get('/profile_fields')
  @swagger.ApiOperation({ summary: 'Get profile fields list' })
  async getProfileFields() {
    return this.service.getProfileFields();
  }

  @common.Post('/profile_fields')
  @swagger.ApiOperation({ summary: 'Add custom user field' })
  @Scope(SettingsActions.update)
  async addProfileField(@common.Body() params: dto.CreateProfileFieldDto) {
    return this.service.addProfileField(params);
  }

  @common.Put('/profile_fields/:field_name')
  @swagger.ApiOperation({ summary: 'Update custom field settings' })
  @Scope(SettingsActions.update)
  async updateProfileField(
    @common.Param('field_name') field_name: string,
    @common.Body() params: dto.UpdateProfileFieldDto,
  ) {
    return this.service.updateProfileField(field_name, params);
  }

  @common.Delete('/profile_fields/:field_name')
  @swagger.ApiOperation({ summary: 'Delete custom user field' })
  @Scope(SettingsActions.update)
  async deleteCustomField(@common.Param('field_name') field_name: string) {
    await this.service.deleteProfileField(field_name);
  }
  //#endregion

  @common.Get('/rules')
  @swagger.ApiOperation({ summary: 'Get field rules list' })
  async getRules() {
    return this.service.getAllRules();
  }

  //#region rules_validations
  @common.Post('/rules/:field_name/rules_validations/:id')
  @swagger.ApiOperation({ summary: 'Add validation rule to rule' })
  @Scope(SettingsActions.update)
  async addRuleValidationToRule(
    @common.Param('field_name') field_name: string,
    @common.Param('id') id: string,
  ) {
    return this.service.addRuleValidationToRule(field_name, parseInt(id, 10));
  }

  @common.Delete('/rules/:field_name/rules_validations/:id')
  @common.HttpCode(204)
  @swagger.ApiOperation({ summary: 'Remove validation rule from rule' })
  @Scope(SettingsActions.update)
  async deleteRuleValidationFromRule(
    @common.Param('field_name') field_name: string,
    @common.Param('id') id: string,
  ) {
    await this.service.deleteRuleValidationFromRule(field_name, parseInt(id, 10));
  }

  @common.Get('/rules_validations')
  @swagger.ApiOperation({ summary: 'Get validation rules list' })
  async getRulesValidations() {
    return this.service.getRulesValidations();
  }

  @common.Get('/rules_validations/:field_name')
  @swagger.ApiOperation({ summary: 'Get validation rules for rule' })
  async getRuleValidationsByRule(@common.Param('field_name') field_name: string) {
    return this.service.getRulesValidations(field_name);
  }

  @common.Post('/rules_validations')
  @swagger.ApiOperation({ summary: 'Add validation rule' })
  @Scope(SettingsActions.update)
  async addRuleValidation(@common.Body() rule: dto.CreateRuleValidationDto) {
    return this.service.addRuleValidation(rule);
  }

  @common.Put('/rules_validations/:id')
  @swagger.ApiOperation({ summary: 'Update validation rule' })
  @Scope(SettingsActions.update)
  async updateRuleValidation(
    @common.Param('id') id: string,
    @common.Body() rule: dto.UpdateRuleValidationDto,
  ) {
    await this.service.updateRuleValidation(parseInt(id, 10), rule);
  }

  @common.Delete('/rules_validations/:id')
  @common.HttpCode(204)
  @swagger.ApiOperation({ summary: 'Delete validation rule' })
  @Scope(SettingsActions.update)
  async deleteRuleValidation(@common.Param('id') id: string) {
    await this.service.deleteRuleValidation(parseInt(id, 10));
  }
  //#endregion

  //#region Client types
  @common.Get('/client_types')
  @swagger.ApiOperation({ summary: 'Get client types list' })
  async getClientTypes() {
    return this.service.getClientTypes();
  }

  @common.Post('/client_types')
  @swagger.ApiOperation({ summary: 'Add client type' })
  @Scope(SettingsActions.update)
  async addClientType(@common.Body() params: dto.CreateClientTypeDto) {
    return this.service.addClientType(params);
  }

  @common.Put('/client_types/:client_type_id')
  @swagger.ApiOperation({ summary: 'Update client type' })
  @Scope(SettingsActions.update)
  async updateClientType(
    @common.Param('client_type_id') id: string,
    @common.Body() params: dto.CreateClientTypeDto,
  ) {
    return this.service.updateClientType(id, params);
  }

  @common.Delete('/client_types/:client_type_id')
  @common.HttpCode(204)
  @swagger.ApiOperation({ summary: 'Delete client type' })
  @Scope(SettingsActions.update)
  async deleteClientType(@common.Param('client_type_id') id: string) {
    await this.service.deleteClientType(id);
  }
  //#endregion
}
