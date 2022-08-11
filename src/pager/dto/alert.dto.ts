export class AlertDto {
  serviceName: string;
  message: string;

  constructor(serviceName: string, message: string) {
    this.serviceName = serviceName;
    this.message = message;
  }
}
