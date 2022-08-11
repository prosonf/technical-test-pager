import { Injectable } from '@nestjs/common';
import { Issue } from './entities/issue.entity';
import { IssueState } from './entities/issue-state.enum';
import { IssueStatus } from './entities/issue-status.enum';

// Transactional: Methods that would be transactional if using a relational database.

@Injectable()
export class PagerRepository {
  private readonly issues = new Map<string, Issue>();

  // Transactional
  createIfNotExists(serviceName: string, level: number): Issue {
    const currentIssue = this.findOpenIssue(serviceName);
    if (currentIssue == null) {
      const issue: Issue = new Issue(serviceName, level);
      return this.create(issue);
    }
    return currentIssue;
  }

  // Transactional
  setStateResolved(serviceName: string): boolean {
    const currentIssue = this.findOpenIssue(serviceName);
    if (currentIssue != null) {
      currentIssue.state = IssueState.RESOLVED;
      currentIssue.resolvingTimestamp = Date.now();
      this.update(currentIssue);
      return true;
    }
    return false;
  }

  // Transactional
  setStatus(serviceName: string, status: IssueStatus): boolean {
    const currentIssue = this.findOpenIssue(serviceName);
    if (currentIssue != null) {
      currentIssue.status = status;
      this.update(currentIssue);
      return true;
    }
    return false;
  }

  // Transactional
  setLastLevelModified(serviceName: string, lastLevelNotified: number): boolean {
    const currentIssue = this.issues.get(serviceName);
    if (currentIssue != null) {
      currentIssue.lastLevelNotified = lastLevelNotified;
      this.update(currentIssue);
      return true;
    }
    return false;
  }

  findOpenIssue(serviceName: string): Issue {
    const serviceIssue = this.issues.get(serviceName);
    return serviceIssue?.state === IssueState.OPEN ? serviceIssue : null;
  }

  private create(issue: Issue) {
    this.issues.set(issue.serviceName, issue);
    return issue;
  }

  // Transactional
  update(issue: Issue) {
    this.issues.set(issue.serviceName, issue);
    return issue;
  }
}
