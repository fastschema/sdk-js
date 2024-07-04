export class RequestError extends Error {
  public isNetworkError?: boolean;
  constructor(message: string) {
    super(message);
    this.isNetworkError = message.includes('Failed to fetch');
  }
}
