import { EscalationPolicyLevel } from './escalation-policy-level.entity';

export class EscalationPolicy {
  serviceName: string;
  private levels: EscalationPolicyLevel[] = [];

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  addEscalationPolicyLevel(level: EscalationPolicyLevel): EscalationPolicy {
    this.levels.push(level);
    return this;
  }

  hasLevel(level): boolean {
    return this.levels.length > level;
  }

  getLevel(level): EscalationPolicyLevel {
    const levels = this.getSortedLevels();
    if (levels.length > level) {
      return levels[level];
    }
    return null;
  }

  private getSortedLevels(): EscalationPolicyLevel[] {
    return this.levels.sort((l1, l2) => (l1.order <= l2.order ? -1 : 1));
  }
}
