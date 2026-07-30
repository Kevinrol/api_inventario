import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex from 'knex';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

export const databaseProvider: Provider = {
  provide: KNEX_CONNECTION,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    
    return knex({
      client: 'mysql2',
      connection: databaseUrl,
      pool: { min: 2, max: 10 },
    });
  },
};
