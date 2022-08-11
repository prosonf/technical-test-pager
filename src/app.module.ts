import { Module } from '@nestjs/common';
import { PagerModule } from './pager/pager.module';

@Module({
  imports: [PagerModule],
})
export class AppModule {}
