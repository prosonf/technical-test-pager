import { EscalationPolicyTargetType } from './escalation-policy-type.enum';
import { EscalationPolicyTarget } from './escalation-policy-target.interface';

export class EscalationPolicySmsTarget implements EscalationPolicyTarget {
  type: EscalationPolicyTargetType = EscalationPolicyTargetType.SMS;
  phoneNumber: number;

  constructor(phoneNumber: number) {
    this.phoneNumber = phoneNumber;
  }
}
