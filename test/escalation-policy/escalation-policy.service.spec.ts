import { Test, TestingModule } from '@nestjs/testing';
import { EscalationPolicyService } from '../../src/escalation-policy/escalation-policy.service';
import { EscalationPolicy } from '../../src/escalation-policy/entities/escalation-policy.entity';
import { EscalationPolicyLevel } from '../../src/escalation-policy/entities/escalation-policy-level.entity';
import { EscalationPolicyEmailTarget } from '../../src/escalation-policy/entities/escalation-policy-email-target.entity';
import { EscalationPolicySmsTarget } from '../../src/escalation-policy/entities/escalation-policy-email-sms.entity';
import { CreateEscalationPolicyDto } from '../../src/escalation-policy/dto/create-escalation-policy.dto';

describe('EscalationPolicyService', () => {
  let service: EscalationPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EscalationPolicyService],
    }).compile();

    service = module.get<EscalationPolicyService>(EscalationPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create escalation policies and return them', () => {
    // Given
    const escalationPolicy1 = new EscalationPolicy('testServiceName01');
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
    const escalationPolicy2 = new EscalationPolicy('testServiceName02');
    escalationPolicy2
      .addEscalationPolicyLevel(
        new EscalationPolicyLevel(1)
          .addTarget(new EscalationPolicyEmailTarget('a@a.com'))
          .addTarget(new EscalationPolicySmsTarget(5550001)),
      )
      .addEscalationPolicyLevel(
        new EscalationPolicyLevel(0)
          .addTarget(new EscalationPolicyEmailTarget('b@a.com'))
          .addTarget(new EscalationPolicySmsTarget(5550002)),
      );

    // When
    service.create(new CreateEscalationPolicyDto(escalationPolicy1));
    service.create(new CreateEscalationPolicyDto(escalationPolicy2));

    // Then
    const actualEscalationPolicy1 = service.findOne('testServiceName01');
    expect(actualEscalationPolicy1).toBeDefined();
    expect(actualEscalationPolicy1.serviceName).toEqual('testServiceName01');
    const actualEscalationPolicy2 = service.findOne('testServiceName02');
    expect(actualEscalationPolicy2).toBeDefined();
    expect(actualEscalationPolicy2.serviceName).toEqual('testServiceName02');
    // Taking advantage of this test I test the sorting of the levels
    expect(escalationPolicy2.getLevel(0).order).toBe(0);
    expect(escalationPolicy2.getLevel(1).order).toBe(1);
    expect(escalationPolicy2.hasLevel(2)).toBeFalsy();
  });
});
