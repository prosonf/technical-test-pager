import { Module } from '@nestjs/common';
// import { EscalationPolicyModule } from '../escalation-policy/escalation-policy.module';
import { NotificationAdapter } from './notification-adapter.service';
import { PagerRepository } from './pager.repository';
import { PagerService } from './pager.service';
import { EscalationPolicyService } from '../escalation-policy/escalation-policy.service';

@Module({
  // imports: [EscalationPolicyModule], // For some reason this import cannot bring the EscalationPolicyService
  providers: [EscalationPolicyService, PagerRepository, NotificationAdapter, PagerService],
})
export class PagerModule {}
