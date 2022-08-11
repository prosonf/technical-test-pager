import { Test, TestingModule } from '@nestjs/testing';
import { EscalationPolicyService } from '../../src/escalation-policy/escalation-policy.service';
import { PagerService } from '../../src/pager/pager.service';
import { PagerRepository } from '../../src/pager/pager.repository';
import { AlertDto } from '../../src/pager/dto/alert.dto';
import { EscalationPolicy } from '../../src/escalation-policy/entities/escalation-policy.entity';
import { EscalationPolicyLevel } from '../../src/escalation-policy/entities/escalation-policy-level.entity';
import { EscalationPolicyEmailTarget } from '../../src/escalation-policy/entities/escalation-policy-email-target.entity';
import { EscalationPolicySmsTarget } from '../../src/escalation-policy/entities/escalation-policy-email-sms.entity';
import { IssueStatus } from '../../src/pager/entities/issue-status.enum';
import { IssueState } from '../../src/pager/entities/issue-state.enum';
import { Issue } from '../../src/pager/entities/issue.entity';
import { NotificationAdapter } from '../../src/pager/notification-adapter.service';

describe('PagerService', () => {
  let service: PagerService;
  let escalationService: EscalationPolicyService;
  let pagerRepository: PagerRepository;
  let notificationAdapter: NotificationAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EscalationPolicyService, PagerRepository, NotificationAdapter, PagerService],
    }).compile();

    service = module.get<PagerService>(PagerService);
    escalationService = module.get<EscalationPolicyService>(EscalationPolicyService);
    pagerRepository = module.get<PagerRepository>(PagerRepository);
    notificationAdapter = module.get<NotificationAdapter>(NotificationAdapter);
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Given a Monitored Service in a Healthy State,
  // when the Pager receives an Alert related to this Monitored Service,
  // then the Monitored Service becomes Unhealthy,
  // the Pager notifies all targets of the first level of the escalation policy,
  // and sets a 15-minutes acknowledgement delay
  it('should open an issue for the service', () => {
    // Given
    const serviceName = 'testingServiceName01';
    const alert = new AlertDto(serviceName, 'Test message');
    givenThereIsEscalationPolicyFor(serviceName);

    // When
    service.newAlert(alert);

    // Then
    const issue = expectAnOpenIssue(serviceName);
    expect(issue.lastLevelNotified).toBe(0);
    expect(issue.status).toEqual(IssueStatus.TO_BE_ACKNOWLEDGED);
    expect(issue.state).toEqual(IssueState.OPEN);
  });

  it('should notify the targets', () => {
    // Given
    const serviceName = 'testingServiceName01';
    const alert = new AlertDto(serviceName, 'Test message');
    const escalationPolicy = givenThereIsEscalationPolicyFor(serviceName);
    const notifyTargetsSpy = jest.spyOn(service, 'notifyTargets');
    const notifySmsSpy = jest.spyOn(notificationAdapter, 'notifySms');
    const notifyEmailSpy = jest.spyOn(notificationAdapter, 'notifyEmail');

    // When
    service.newAlert(alert);

    // Then
    const issue = expectAnOpenIssue(serviceName);
    expect(notifyTargetsSpy).toHaveBeenCalledWith(escalationPolicy.getLevel(0).targets, issue);
    expect(notifySmsSpy).toHaveBeenCalledTimes(1);
    expect(notifyEmailSpy).toHaveBeenCalledTimes(1);
  });

  it('should set a delay for re-sending notifications', () => {
    // Given
    const serviceName = 'testingServiceName01';
    const alert = new AlertDto(serviceName, 'Test message');
    givenThereIsEscalationPolicyFor(serviceName);
    const setAcknowledgmentDelaySpy = jest.spyOn(service, 'setAcknowledgmentDelay');

    // When
    service.newAlert(alert);

    // Then
    expect(setAcknowledgmentDelaySpy).toHaveBeenCalledWith(serviceName, 15);
  });

  // Given a Monitored Service in an Unhealthy State,
  // the corresponding Alert is not Acknowledged
  // and the last level has not been notified,
  // when the Pager receives the Acknowledgement Timeout,
  // then the Pager notifies all targets of the next level of the escalation policy
  // and sets a 15-minutes acknowledgement delay.
  it('should reuse an already open issue for the service and notify and set a delay', () => {
    // Given
    const serviceName = 'testingServiceName01';
    // Issue saved stating level 0 has already been notified
    pagerRepository.createIfNotExists(serviceName, 0);
    const escalationPolicy = givenThereIsEscalationPolicyFor(serviceName);
    const notifyTargetsSpy = jest.spyOn(service, 'notifyTargets');
    const setAcknowledgmentDelaySpy = jest.spyOn(service, 'setAcknowledgmentDelay');

    // When
    service.acknowledgementTimeout(serviceName);

    // Then
    const issue = expectAnOpenIssue(serviceName);
    expect(issue.lastLevelNotified).toBe(1);
    expect(issue.status).toEqual(IssueStatus.TO_BE_ACKNOWLEDGED);
    expect(issue.state).toEqual(IssueState.OPEN);
    expect(notifyTargetsSpy).toHaveBeenCalledWith(escalationPolicy.getLevel(1).targets, issue);
    expect(setAcknowledgmentDelaySpy).toHaveBeenCalledWith(serviceName, 15);
  });

  // Given a Monitored Service in an Unhealthy State
  // when the Pager receives the Acknowledgement
  // and later receives the Acknowledgement Timeout,
  // then the Pager doesn't notify any Target
  // and doesn't set an acknowledgement delay.
  it('should not notify on ack timeout when the issue has already been acknowledged', () => {
    // Given
    const serviceName = 'testingServiceName01';
    pagerRepository.createIfNotExists(serviceName, 0);
    const notifyTargetsSpy = jest.spyOn(service, 'notifyTargets');
    const setAcknowledgmentDelaySpy = jest.spyOn(service, 'setAcknowledgmentDelay');

    // When
    service.acknowledgeIssue(serviceName);
    service.acknowledgementTimeout(serviceName);

    // Then
    const issue = expectAnOpenIssue(serviceName);
    expect(issue.lastLevelNotified).toBe(0);
    expect(issue.status).toEqual(IssueStatus.ACKNOWLEDGED);
    expect(issue.state).toEqual(IssueState.OPEN);
    expect(notifyTargetsSpy).not.toHaveBeenCalled();
    expect(setAcknowledgmentDelaySpy).not.toHaveBeenCalled();
  });

  // Given a Monitored Service in an Unhealthy State,
  // when the Pager receives an Alert related to this Monitored Service,
  // then the Pager doesn’t notify any Target
  // and doesn’t set an acknowledgement delay
  it('should not notify if there is no escalation policy', () => {
    // Given
    const serviceName = 'testingServiceName01';
    pagerRepository.createIfNotExists(serviceName, -1);
    const alert = new AlertDto(serviceName, 'Test message');
    const notifyTargetsSpy = jest.spyOn(service, 'notifyTargets');
    const setAcknowledgmentDelaySpy = jest.spyOn(service, 'setAcknowledgmentDelay');

    // When
    service.newAlert(alert);

    // Then
    const issue = expectAnOpenIssue(serviceName);
    expect(issue.lastLevelNotified).toBe(-1);
    expect(issue.status).toEqual(IssueStatus.TO_BE_ACKNOWLEDGED);
    expect(issue.state).toEqual(IssueState.OPEN);
    expect(notifyTargetsSpy).not.toHaveBeenCalled();
    expect(setAcknowledgmentDelaySpy).not.toHaveBeenCalled();
  });

  // Given a Monitored Service in an Unhealthy State,
  // when the Pager receives a Healthy event related to this Monitored Service
  // and later receives the Acknowledgement Timeout,
  // then the Monitored Service becomes Healthy,
  // the Pager doesn’t notify any Target
  // and doesn’t set an acknowledgement delay
  it('should not notify if the service is already healthy', () => {
    // Given
    const serviceName = 'testingServiceName01';
    pagerRepository.createIfNotExists(serviceName, 0);
    const notifyTargetsSpy = jest.spyOn(service, 'notifyTargets');
    const setAcknowledgmentDelaySpy = jest.spyOn(service, 'setAcknowledgmentDelay');

    // When
    service.fixIssue(serviceName);
    service.acknowledgementTimeout(serviceName);

    // Then
    expect(notifyTargetsSpy).not.toHaveBeenCalled();
    expect(setAcknowledgmentDelaySpy).not.toHaveBeenCalled();
  });

  function givenThereIsEscalationPolicyFor(serviceName: string): EscalationPolicy {
    const escalationPolicy1 = new EscalationPolicy(serviceName);
    escalationPolicy1
      .addEscalationPolicyLevel(
        new EscalationPolicyLevel(0)
          .addTarget(new EscalationPolicyEmailTarget('a@a.com'))
          .addTarget(new EscalationPolicySmsTarget(5550001)),
      )
      .addEscalationPolicyLevel(
        new EscalationPolicyLevel(1)
          .addTarget(new EscalationPolicyEmailTarget('b@a.com'))
          .addTarget(new EscalationPolicySmsTarget(5550002)),
      );

    jest
      .spyOn(escalationService, 'findOne')
      .mockImplementationOnce((requestedServiceName: string) =>
        serviceName === requestedServiceName ? escalationPolicy1 : null,
      );
    return escalationPolicy1;
  }

  function expectAnOpenIssue(serviceName: string): Issue {
    const issue = pagerRepository.findOpenIssue(serviceName);
    expect(issue).toBeDefined();
    return issue;
  }
});
