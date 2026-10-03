export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  readonly resendAvailableInSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: {
      fields?: Record<string, string[]>;
      resendAvailableInSeconds?: number;
    },
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = extra?.fields;
    this.resendAvailableInSeconds = extra?.resendAvailableInSeconds;
  }
}
