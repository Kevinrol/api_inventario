import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { Knex } from 'knex';
import { databaseProvider, KNEX_CONNECTION } from './database.provider';

@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async onApplicationShutdown() {
    if (this.knex) {
      await this.knex.destroy();
    }
  }
}
