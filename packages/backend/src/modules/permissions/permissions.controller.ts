import * as common from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';

@common.Controller('v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @common.Get('roles')
  @swagger.ApiOperation({ summary: 'Get permissions grouped by roles' })
  getPermissionsByRoles() {
    return this.permissionsService.getRolePermissions();
  }
}
