import { EscalationPolicyTargetType } from './escalation-policy-type.enum';
import { EscalationPolicyTarget } from './escalation-policy-target.interface';

export class EscalationPolicyEmailTarget implements EscalationPolicyTarget {
  type: EscalationPolicyTargetType = EscalationPolicyTargetType.EMAIL;
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}
