import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEmail } from 'class-validator';

export class CreateInvitationDto {
  @IsArray()
  @IsEmail({}, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim().toLowerCase());
    }
  })
  @ApiProperty()
  email: string[];
}
