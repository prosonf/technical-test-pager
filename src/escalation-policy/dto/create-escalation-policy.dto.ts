import { EscalationPolicy } from '../entities/escalation-policy.entity';

export class CreateEscalationPolicyDto {
  escalationPolicy: EscalationPolicy;

  constructor(escalationPolicy: EscalationPolicy) {
    this.escalationPolicy = escalationPolicy;
  }
}
