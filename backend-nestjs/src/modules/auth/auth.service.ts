import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import type { Environment } from '../../shared/config/env.js';
import { DatabaseService } from '../../shared/database/database.service.js';
import { createAuth } from './auth.factory.js';
import type { Auth } from './auth.factory.js';

@Injectable()
export class AuthService {
  readonly auth: Auth;

  constructor(
    @Inject(ConfigService) config: ConfigService<Environment, true>,
    @Inject(DatabaseService) database: DatabaseService,
  ) {
    this.auth = createAuth(config, database.db);
  }

  getSession(headers: IncomingHttpHeaders) {
    return this.auth.api.getSession({
      headers: fromNodeHeaders(headers),
      query: { disableCookieCache: true },
    });
  }
}
