import { EscalationPolicyTarget } from './escalation-policy-target.interface';

export class EscalationPolicyLevel {
  order: number;
  targets: Set<EscalationPolicyTarget> = new Set<EscalationPolicyTarget>();

  constructor(order: number) {
    this.order = order;
  }

  addTarget(target: EscalationPolicyTarget): EscalationPolicyLevel {
    this.targets.add(target);
    return this;
  }
}
