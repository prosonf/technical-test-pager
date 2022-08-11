import { Injectable, Logger } from '@nestjs/common';
import { AlertDto } from './dto/alert.dto';
import { EscalationPolicyService } from '../escalation-policy/escalation-policy.service';
import { PagerRepository } from './pager.repository';
import { IssueStatus } from './entities/issue-status.enum';
import { IssueState } from './entities/issue-state.enum';
import { Issue } from './entities/issue.entity';
import { EscalationPolicy } from '../escalation-policy/entities/escalation-policy.entity';
import { EscalationPolicyTarget } from '../escalation-policy/entities/escalation-policy-target.interface';
import { EscalationPolicyTargetType } from '../escalation-policy/entities/escalation-policy-type.enum';
import { NotificationAdapter } from './notification-adapter.service';
import { EscalationPolicySmsTarget } from '../escalation-policy/entities/escalation-policy-email-sms.entity';
import { EscalationPolicyEmailTarget } from '../escalation-policy/entities/escalation-policy-email-target.entity';

const ACKNOWLEDGEMENT_DELAY_MIN = 15;

@Injectable()
export class PagerService {
  private readonly logger = new Logger(PagerService.name);
  private readonly notificationAdapterByType;

  constructor(
    private readonly pagerRepository: PagerRepository,
    private readonly notificationAdapter: NotificationAdapter,
    private readonly escalationPolicyService: EscalationPolicyService,
  ) {
    // Different way of modelling choosing an adapter without using an interface
    this.notificationAdapterByType = {
      [EscalationPolicyTargetType.SMS]: (target: EscalationPolicySmsTarget, issue: Issue) =>
        notificationAdapter.notifySms(target, issue),
      [EscalationPolicyTargetType.EMAIL]: (target: EscalationPolicyEmailTarget, issue: Issue) =>
        notificationAdapter.notifyEmail(target, issue),
    };
  }

  newAlert(alert: AlertDto) {
    const serviceName = alert.serviceName;
    const escalationPolicy = this.getEscalationPolicy(serviceName);
    // As per https://stackoverflow.com/questions/28975896/is-there-a-way-to-check-for-both-null-and-undefined
    if (escalationPolicy == null) {
      return;
    }

    const issue = this.pagerRepository.createIfNotExists(serviceName, -1);
    if (issue && issue.status === IssueStatus.TO_BE_ACKNOWLEDGED) {
      this.notifyNextLevelTargets(issue, escalationPolicy);
      this.setAcknowledgmentDelay(serviceName, ACKNOWLEDGEMENT_DELAY_MIN);
    }
  }

  acknowledgeIssue(serviceName: string): boolean {
    return this.pagerRepository.setStatus(serviceName, IssueStatus.ACKNOWLEDGED);
  }

  acknowledgementTimeout(serviceName: string) {
    const openIssue = this.pagerRepository.findOpenIssue(serviceName);
    if (
      openIssue != null &&
      openIssue.state === IssueState.OPEN &&
      openIssue.status === IssueStatus.TO_BE_ACKNOWLEDGED
    ) {
      const escalationPolicy = this.getEscalationPolicy(serviceName);

      this.notifyNextLevelTargets(openIssue, escalationPolicy);
      this.setAcknowledgmentDelay(serviceName, ACKNOWLEDGEMENT_DELAY_MIN);
    }
  }

  fixIssue(serviceName: string): boolean {
    return this.pagerRepository.setStateResolved(serviceName);
  }

  private getEscalationPolicy(serviceName: string) {
    const escalationPolicy = this.escalationPolicyService.findOne(serviceName);
    if (escalationPolicy == null) {
      this.logger.log(`No escalation policy for service ${serviceName}`);
      return null;
    }
    if (!escalationPolicy.hasLevel(0)) {
      this.logger.log(`No escalation policy levels setup for service ${serviceName}`);
      return null;
    }
    return escalationPolicy;
  }

  notifyNextLevelTargets(issue: Issue, escalationPolicy: EscalationPolicy) {
    const nextLevel = issue.lastLevelNotified + 1;
    if (escalationPolicy == null || !escalationPolicy.hasLevel(nextLevel)) {
      return;
    }
    const escalationPolicyLevel = escalationPolicy.getLevel(nextLevel);
    this.pagerRepository.setLastLevelModified(issue.serviceName, nextLevel);

    this.notifyTargets(escalationPolicyLevel.targets, issue);
  }

  notifyTargets(targets: Set<EscalationPolicyTarget>, issue: Issue) {
    targets.forEach((target) => this.notificationAdapterByType[target.type](target, issue));
  }

  setAcknowledgmentDelay(serviceName: string, minutes) {
    this.logger.log(`Setting acknowledgement delay of ${minutes} for service ${serviceName}`);
  }
}
