import { Injectable, Logger } from '@nestjs/common';
import { Issue } from './entities/issue.entity';
import { EscalationPolicyEmailTarget } from '../escalation-policy/entities/escalation-policy-email-target.entity';
import { EscalationPolicySmsTarget } from '../escalation-policy/entities/escalation-policy-email-sms.entity';

@Injectable()
export class NotificationAdapter {
  private readonly logger = new Logger(NotificationAdapter.name);

  notifySms(target: EscalationPolicySmsTarget, issue: Issue) {
    this.logger.log(`Notifying issue for service ${issue.serviceName} via SMS to ${target.phoneNumber}`);
  }

  notifyEmail(target: EscalationPolicyEmailTarget, issue: Issue) {
    this.logger.log(`Notifying issue for service ${issue.serviceName} via EMAIL to ${target.email}`);
  }
}
