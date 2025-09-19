/**
 * Batch Email Service
 * Handles sending emails to multiple selected users via the backend API
 */

class BatchEmailService {
  constructor(apiServerUrl, accessToken, orgId) {
    this.apiServerUrl = apiServerUrl;
    this.accessToken = accessToken;
    this.orgId = orgId;
  }

  /**
   * Send an email to a single user
   * @param {Object} user - The user object
   * @param {string} message - The email message content
   * @param {string} subject - The email subject
   * @param {string} recipientType - The recipient type (mentor, judge, etc.)
   * @param {string} eventId - The event ID for placeholder replacement
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendEmailToUser(user, message, subject, recipientType, eventId) {
    try {
      // Replace [EVENT_ID] placeholder in message if present
      let processedMessage = message;
      if (eventId && message.includes('[EVENT_ID]')) {
        processedMessage = message.replace(/\[EVENT_ID\]/g, eventId);
      }

      const response = await fetch(`${this.apiServerUrl}/api/admin/${user.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Org-Id': this.orgId,
        },
        body: JSON.stringify({
          message: processedMessage,
          subject: subject,
          recipient_type: recipientType,
          recipient_id: user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: data.success || true, 
          data 
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Send emails to multiple users with progress tracking
   * @param {Array} users - Array of user objects with id, name, email
   * @param {string} message - The email message content
   * @param {string} subject - The email subject
   * @param {string} recipientType - The recipient type
   * @param {string} eventId - The event ID for placeholder replacement
   * @param {Function} onProgress - Callback for progress updates
   * @returns {Promise<{results: Array, summary: Object}>}
   */
  async sendBatchEmails(users, message, subject, recipientType, eventId, onProgress = () => {}) {
    const results = [];
    const summary = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Update progress
      onProgress({
        current: i + 1,
        total: users.length,
        currentUser: user.name || user.email || user.id,
        percentage: Math.round(((i + 1) / users.length) * 100)
      });

      const result = await this.sendEmailToUser(user, message, subject, recipientType, eventId);
      
      const userResult = {
        user: user,
        success: result.success,
        error: result.error
      };

      results.push(userResult);

      if (result.success) {
        summary.successful++;
      } else {
        summary.failed++;
        summary.errors.push({
          user: user.name || user.email || user.id,
          error: result.error
        });
      }

      // Small delay to avoid overwhelming the API
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return { results, summary };
  }

  /**
   * Filter users who are selected and have email addresses
   * @param {Array} users - Array of user objects
   * @returns {Array} Filtered users ready for email sending
   */
  static filterEligibleUsers(users) {
    return users.filter(user =>
      (user.isSelected !== undefined ? user.isSelected : true) && // Default to selected for community members
      user.email &&
      user.email.trim() !== '' &&
      user.id // Must have an ID for the API endpoint
    );
  }

  /**
   * Filter users who are NOT selected and have email addresses (for rejection emails)
   * @param {Array} users - Array of user objects
   * @returns {Array} Filtered users ready for rejection email sending
   */
  static filterNotSelectedUsers(users) {
    return users.filter(user => 
      !user.isSelected && 
      user.email && 
      user.email.trim() !== '' &&
      user.id // Must have an ID for the API endpoint
    );
  }

  /**
   * Validate email message content
   * @param {string} message - Message content to validate
   * @returns {string} Error message if invalid, empty string if valid
   */
  static validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return 'Message content is required';
    }
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return 'Message cannot be empty';
    }
    
    if (trimmedMessage.length > 10000) {
      return 'Message is too long (max 10,000 characters)';
    }
    
    return '';
  }

  /**
   * Validate email subject
   * @param {string} subject - Subject to validate
   * @returns {string} Error message if invalid, empty string if valid
   */
  static validateSubject(subject) {
    if (!subject || typeof subject !== 'string') {
      return 'Subject is required';
    }
    
    const trimmedSubject = subject.trim();
    if (trimmedSubject.length === 0) {
      return 'Subject cannot be empty';
    }
    
    if (trimmedSubject.length > 200) {
      return 'Subject is too long (max 200 characters)';
    }
    
    return '';
  }

  /**
   * Get recipient type from volunteer type
   * @param {string} volunteerType - The volunteer type (mentors, judges, etc.)
   * @returns {string} Singular form of the volunteer type
   */
  static getRecipientType(volunteerType) {
    const typeMap = {
      'mentors': 'mentor',
      'judges': 'judge',
      'volunteers': 'volunteer',
      'hackers': 'hacker',
      'sponsors': 'sponsor',
      'community members': 'community',
      'community': 'community',
      'slack': 'community'
    };

    return typeMap[volunteerType] || volunteerType;
  }
}

export default BatchEmailService;