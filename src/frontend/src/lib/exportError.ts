/**
 * Utility to extract a safe, actionable English error message from unknown errors
 */
export function getExportErrorReason(error: unknown): string {
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for common IC/canister error patterns
    if (message.includes('Unauthorized')) {
      return 'Authentication required';
    }
    if (message.includes('not available') || message.includes('Actor not available')) {
      return 'Backend connection lost';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Request timed out';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error';
    }
    if (message.includes('canister') && message.includes('trapped')) {
      return 'Backend processing error';
    }
    
    // Return sanitized message (limit length, remove sensitive data patterns)
    const sanitized = message
      .replace(/principal "[^"]+"/gi, 'principal [hidden]')
      .replace(/canister [a-z0-9-]+/gi, 'canister [id]')
      .substring(0, 100);
    
    return sanitized || 'Unknown error occurred';
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error.substring(0, 100) || 'Unknown error';
  }
  
  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message);
    return msg.substring(0, 100) || 'Unknown error';
  }
  
  // Fallback
  return 'Export failed - please try again';
}
