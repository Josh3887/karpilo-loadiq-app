export class LoadIQError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly safeMessage = message
  ) {
    super(message);
    this.name = "LoadIQError";
  }
}

export function getSafeErrorMessage(error: unknown) {
  if (error instanceof LoadIQError) {
    return error.safeMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Try again in a moment.";
}
