import { IssueState } from './issue-state.enum';
import { IssueStatus } from './issue-status.enum';

export class Issue {
  serviceName: string;
  lastLevelNotified: number;
  state: IssueState;
  status: IssueStatus;
  creationTimestamp: number;
  resolvingTimestamp: number;

  constructor(
    serviceName: string,
    lastLevelNotified: number,
    state: IssueState = IssueState.OPEN,
    status: IssueStatus = IssueStatus.TO_BE_ACKNOWLEDGED,
    creationTimestamp = Date.now(),
  ) {
    this.serviceName = serviceName;
    this.lastLevelNotified = lastLevelNotified;
    this.state = state;
    this.status = status;
    this.creationTimestamp = creationTimestamp;
  }
}
