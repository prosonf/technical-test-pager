import { Module } from '@nestjs/common';
import { EscalationPolicyService } from './escalation-policy.service';

@Module({
  providers: [EscalationPolicyService],
})
export class EscalationPolicyModule {}
