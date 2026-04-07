/**
 * Utility to extract a safe, actionable English error message from unknown errors
 * Preserves full replica rejection details including Request IDs
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
    
    // Preserve replica rejection details with Request ID
    if (message.includes('replica returned a rejection') || message.includes('Request ID')) {
      // Return the full message to preserve Request ID and rejection details
      return message;
    }
    
    if (message.includes('canister') && message.includes('trapped')) {
      return 'Backend processing error';
    }
    
    // Return sanitized message (limit length, remove sensitive data patterns)
    // But preserve Request IDs and rejection error details
    const sanitized = message
      .replace(/principal "[^"]+"/gi, 'principal [hidden]')
      .replace(/canister [a-z0-9-]+(?!.*Request ID)/gi, 'canister [id]')
      .substring(0, 300); // Increased limit to preserve full rejection messages
    
    return sanitized || 'Unknown error occurred';
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    // Preserve full replica rejection messages
    if (error.includes('replica returned a rejection') || error.includes('Request ID')) {
      return error;
    }
    return error.substring(0, 300) || 'Unknown error';
  }
  
  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message);
    // Preserve full replica rejection messages
    if (msg.includes('replica returned a rejection') || msg.includes('Request ID')) {
      return msg;
    }
    return msg.substring(0, 300) || 'Unknown error';
  }
  
  // Fallback
  return 'Export failed - please try again';
}
