type TBootstrapRetryOptions<T> = {
  taskName: string;
  task: () => Promise<T>;
  initialDelayMs?: number;
  maxDelayMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
};

export const runWithBootstrapRetry = async <T>({
  taskName,
  task,
  initialDelayMs = 1000,
  maxDelayMs = 15000,
}: TBootstrapRetryOptions<T>): Promise<T> => {
  let attempt = 1;
  let delayMs = initialDelayMs;

  while (true) {
    try {
      const result = await task();

      if (attempt > 1) {
        console.info(`[Bootstrap] ${taskName} recovered on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      console.error(
        `[Bootstrap] ${taskName} failed on attempt ${attempt}. Retrying in ${delayMs}ms.\n${getErrorMessage(
          error,
        )}`,
      );

      await sleep(delayMs);
      attempt += 1;
      delayMs = Math.min(delayMs * 2, maxDelayMs);
    }
  }
};
