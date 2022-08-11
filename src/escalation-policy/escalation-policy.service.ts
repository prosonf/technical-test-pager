import { Injectable } from '@nestjs/common';
import { CreateEscalationPolicyDto } from './dto/create-escalation-policy.dto';
import { EscalationPolicy } from './entities/escalation-policy.entity';

// For the sake of the exercise, this will be the only logic implemented for escalation policies
@Injectable()
export class EscalationPolicyService {
  private escalationPolicies = new Map<string, EscalationPolicy>();

  create(createEscalationPolicyDto: CreateEscalationPolicyDto) {
    const escalationPolicy = createEscalationPolicyDto.escalationPolicy;
    this.escalationPolicies.set(escalationPolicy.serviceName, escalationPolicy);
  }

  findOne(serviceName: string) {
    return this.escalationPolicies.get(serviceName);
  }
}
