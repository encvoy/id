import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';
import { ListInputDto } from 'src/custom.dto';

export class ListGroupsDto extends ListInputDto {}

export class ListGroupUsersDto extends ListInputDto {}

export class ListApplicationAccessGroupsDto extends ListInputDto {}

export class CreateGroupDto {
  @IsString()
  @ApiProperty({ description: 'Group name' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Group description' })
  description?: string;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

export class AddGroupUserDto {
  @IsString()
  @ApiProperty({ description: 'User ID to add to the group' })
  user_id: string;
}

export class ReplaceApplicationAccessGroupsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @ApiProperty({ description: 'List of group IDs to attach to the application', type: [String] })
  group_ids: string[];
}
