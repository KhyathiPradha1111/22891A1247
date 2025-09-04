

/**
 * Logging Middleware for Affordmed Frontend
 * Sends logs to the specified Affordmed API endpoint.
 *
 * @param {Object} params - Parameters for logging
 * @param {string} params.stack - Should be "frontend"
 * @param {string} params.level - Log level: "info", "warning", "error", "fatal"
 * @param {string} params.packageName - Package/module name, e.g. "shortener"
 * @param {string} params.message - Log message content, description
 */
export async function logMiddleware({ stack = "frontend", level, packageName = "main", message }) {
  const url = process.env.REACT_APP_LOG_API_URL;


  if (!level || !message) {
    
    console.warn("logMiddleware: 'level' and 'message' are required.");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message
      })
    });

    if (!response.ok) {
      
      throw new Error(`Log API error: HTTP ${response.status}`);
    }

    const result = await response.json();


    return result;
  } catch (error) {
    
  }
}
