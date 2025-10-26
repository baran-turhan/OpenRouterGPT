export class BackendHttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly payload?: unknown) {
    super(message);
    this.name = 'BackendHttpError';
  }
}
