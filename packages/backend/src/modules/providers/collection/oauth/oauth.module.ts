import { Module } from '@nestjs/common';
import { CustomService } from './custom.service';
import { GithubService } from './github.service';
import { GoogleService } from './google.service';

@Module({
  providers: [CustomService, GithubService, GoogleService],
  exports: [CustomService, GithubService, GoogleService],
})
export class OauthModule {}
