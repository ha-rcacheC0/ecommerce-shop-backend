/**
 * Progress utilities for CLI feedback
 * Provides progress bars, spinners, and other visual feedback utilities
 */

let spinnerTimer: NodeJS.Timeout | null = null;
const spinner = ["-", "\\", "|", "/"];
let spinnerIdx = 0;

/**
 * Displays a progress bar in the console
 * @param current Current progress value
 * @param total Total value to reach
 * @param width Width of the progress bar in characters
 */
export const printProgressBar = (
  current: number,
  total: number,
  width: number = 50
): void => {
  const percentage = Math.floor((current / total) * 100);
  const filledWidth = Math.floor((current / total) * width);
  const emptyWidth = width - filledWidth;

  const progressBar =
    "[" +
    "=".repeat(filledWidth) +
    (filledWidth < width ? ">" : "") +
    " ".repeat(Math.max(0, emptyWidth - (filledWidth < width ? 1 : 0))) +
    "] " +
    percentage +
    "%";

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(progressBar + ` (${current}/${total})`);
};

/**
 * Starts a spinner animation with a message
 * @param message Message to display next to the spinner
 */
export const startSpinner = (message: string): void => {
  if (spinnerTimer) {
    clearInterval(spinnerTimer);
  }

  spinnerIdx = 0;
  process.stdout.write(message);

  spinnerTimer = setInterval(() => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${message} ${spinner[spinnerIdx]} `);
    spinnerIdx = (spinnerIdx + 1) % spinner.length;
  }, 200);
};

/**
 * Stops the spinner animation
 * @param finalMessage Optional final message to display
 */
export const stopSpinner = (finalMessage?: string): void => {
  if (spinnerTimer) {
    clearInterval(spinnerTimer);
    spinnerTimer = null;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    if (finalMessage) {
      process.stdout.write(finalMessage + "\n");
    }
  }
};

/**
 * Prints a section header
 * @param title Section title
 * @param char Character to use for the divider
 * @param width Width of the divider
 */
export const printSection = (
  title: string,
  char: string = "=",
  width: number = 37
): void => {
  const divider = char.repeat(width);
  console.log(`\n${divider}`);
  console.log(title);
  console.log(divider);
};

/**
 * Ensures spinner is stopped before process exit
 * Call this function when the application is about to exit
 */
export const cleanup = (): void => {
  if (spinnerTimer) {
    stopSpinner();
  }
};

// Handle unexpected exits
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
