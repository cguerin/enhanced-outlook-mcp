import config from '../config.js';
import logger from '../utils/logger.js';
import { GraphApiClient } from '../utils/graph-api.js';

/**
 * Create a new calendar event
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - Creation result
 */
async function createEventHandler(params = {}) {
  const userId = params.userId || 'default';
  const calendarId = params.calendarId || 'primary';
  
  // Check required parameters
  if (!params.subject) {
    return {
      status: 'error',
      message: 'Event subject is required'
    };
  }
  
  if (!params.start) {
    return {
      status: 'error',
      message: 'Event start time is required'
    };
  }
  
  try {
    logger.info(`Creating calendar event "${params.subject}" for user ${userId}`);
    
    const graphClient = new GraphApiClient(userId);
    
    // Prepare event data
    const eventData = {
      subject: params.subject,
      body: {
        contentType: params.bodyType || 'HTML',
        content: params.body || ''
      },
      start: {
        dateTime: params.start,
        timeZone: params.timeZone || 'UTC'
      },
      end: {
        dateTime: params.end || getDefaultEndTime(params.start),
        timeZone: params.timeZone || 'UTC'
      },
      location: formatLocation(params.location),
      attendees: formatAttendees(params.attendees),
      isAllDay: params.isAllDay === true,
      sensitivity: params.sensitivity || 'normal',
      showAs: params.showAs || 'busy'
    };
    
    // If it's an online meeting
    if (params.isOnlineMeeting === true) {
      eventData.isOnlineMeeting = true;
      eventData.onlineMeetingProvider = params.onlineMeetingProvider || 'teamsForBusiness';
    }
    
    // If categories are provided
    if (params.categories && Array.isArray(params.categories)) {
      eventData.categories = params.categories;
    }
    
    // Create the event in the specified calendar
    let endpoint;
    if (calendarId === 'primary') {
      endpoint = '/me/events';
    } else {
      endpoint = `/me/calendars/${calendarId}/events`;
    }
    
    const event = await graphClient.post(endpoint, eventData);
    
    return {
      status: 'success',
      message: 'Event created successfully',
      eventId: event.id,
      webLink: event.webLink
    };
  } catch (error) {
    logger.error(`Error creating calendar event: ${error.message}`);
    
    return {
      status: 'error',
      message: `Failed to create calendar event: ${error.message}`
    };
  }
}

/**
 * Calculate default end time (30 minutes after start)
 * @param {string} startTime - ISO string start time
 * @returns {string} - ISO string end time
 */
function getDefaultEndTime(startTime) {
  try {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes later
    return end.toISOString();
  } catch (error) {
    logger.warn(`Error calculating default end time: ${error.message}`);
    return startTime; // Return original if parsing fails
  }
}

/**
 * Format location data for API
 * @param {string|Object} location - Location information
 * @returns {Object} - Formatted location
 */
function formatLocation(location) {
  if (!location) {
    return null;
  }
  
  // If it's already in the correct format
  if (typeof location === 'object' && location.displayName) {
    return location;
  }
  
  // If it's a string, use as display name
  if (typeof location === 'string') {
    return {
      displayName: location
    };
  }
  
  // If it's an object with specific properties
  if (typeof location === 'object') {
    return {
      displayName: location.name || location.displayName || 'Unknown Location',
      address: location.address,
      coordinates: location.coordinates
    };
  }
  
  // Default case
  return {
    displayName: String(location)
  };
}

/**
 * Format attendees for API
 * @param {Array|string|Object} attendees - Attendees in various formats
 * @returns {Array} - Formatted attendees
 */
function formatAttendees(attendees) {
  if (!attendees) {
    return [];
  }
  
  // Handle string with comma or semicolon separators
  if (typeof attendees === 'string') {
    attendees = attendees.split(/[,;]/).map(a => a.trim()).filter(Boolean);
  }
  
  // Ensure it's an array
  if (!Array.isArray(attendees)) {
    attendees = [attendees];
  }
  
  // Format each attendee
  return attendees.map(attendee => {
    // If already in the correct format
    if (typeof attendee === 'object' && attendee.emailAddress) {
      return attendee;
    }
    
    // Handle string in format "Name <email@example.com>"
    if (typeof attendee === 'string') {
      const match = attendee.match(/^(.*?)\s*<([^>]+)>$/);
      if (match) {
        return {
          emailAddress: {
            name: match[1].trim(),
            address: match[2].trim()
          },
          type: 'required'
        };
      }
      
      // Just an email address
      return {
        emailAddress: {
          address: attendee.trim()
        },
        type: 'required'
      };
    }
    
    // Handle object with name and email properties
    if (typeof attendee === 'object' && attendee.email) {
      return {
        emailAddress: {
          name: attendee.name || '',
          address: attendee.email
        },
        type: attendee.type || 'required'
      };
    }
    
    // Default case
    return {
      emailAddress: {
        address: String(attendee)
      },
      type: 'required'
    };
  });
}

export {
  createEventHandler
};