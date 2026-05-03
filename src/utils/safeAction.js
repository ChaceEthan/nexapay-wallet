/**
 * safeAction
 * A secure execution wrapper to prevent infinite loading states 
 * and handle async failures with timeouts.
 */

export const executeSecurely = async (actionFn, options = {}) => {
  const { 
    timeout = 15000, 
    errorMessage = "Operation timed out. Please try again.",
    onStart,
    onFinish 
  } = options;

  if (onStart) onStart();

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);
  });

  try {
    // Race the action against the timeout
    const result = await Promise.race([
      actionFn(),
      timeoutPromise
    ]);

    return { success: true, data: result };
  } catch (error) {
    console.error("🕵️ Secure Execution Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    if (onFinish) onFinish();
  }
};
