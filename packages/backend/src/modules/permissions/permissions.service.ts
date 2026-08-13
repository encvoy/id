import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DOMAIN } from '../../constants';
import { getInternalRequestHeaders } from '../../internal-request';
import { getRolePermissionsPayload } from '../../role-permissions';

@Injectable()
export class PermissionsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsService.name);

  getRolePermissions() {
    return getRolePermissionsPayload();
  }

  onApplicationBootstrap() {
    void this.updatePermissionsToOidc();
  }

  private async updatePermissionsToOidc() {
    try {
      const response = await fetch(`${DOMAIN}/oidc/update-role-permissions`, {
        method: 'POST',
        headers: await getInternalRequestHeaders(),
        body: JSON.stringify(this.getRolePermissions()),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to update OIDC role permissions cache: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
