import config from '../config.js';
import logger from '../utils/logger.js';
import { GraphApiClient } from '../utils/graph-api.js';

/**
 * List mail rules
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - List of rules
 */
async function listRulesHandler(params = {}) {
  const userId = params.userId || 'default';
  
  try {
    logger.info(`Listing mail rules for user ${userId}`);
    
    const graphClient = new GraphApiClient(userId);
    
    // Get mailbox rules
    const response = await graphClient.get('/me/mailFolders/inbox/messageRules');
    
    if (!response || !response.value) {
      return {
        status: 'error',
        message: 'Failed to retrieve mail rules'
      };
    }
    
    // Format the rules
    const rules = response.value.map(rule => formatRuleResponse(rule));
    
    return {
      status: 'success',
      count: rules.length,
      rules
    };
  } catch (error) {
    logger.error(`Error listing mail rules: ${error.message}`);
    
    return {
      status: 'error',
      message: `Failed to list mail rules: ${error.message}`
    };
  }
}

/**
 * Get a specific mail rule
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - Rule details
 */
async function getRuleHandler(params = {}) {
  const userId = params.userId || 'default';
  const ruleId = params.ruleId;
  
  if (!ruleId) {
    return {
      status: 'error',
      message: 'Rule ID is required'
    };
  }
  
  try {
    logger.info(`Getting mail rule ${ruleId} for user ${userId}`);
    
    const graphClient = new GraphApiClient(userId);
    
    // Get specific rule
    const rule = await graphClient.get(`/me/mailFolders/inbox/messageRules/${ruleId}`);
    
    if (!rule) {
      return {
        status: 'error',
        message: `Rule not found with ID: ${ruleId}`
      };
    }
    
    // Format the rule
    const formattedRule = formatRuleResponse(rule);
    
    return {
      status: 'success',
      rule: formattedRule
    };
  } catch (error) {
    logger.error(`Error getting mail rule: ${error.message}`);
    
    return {
      status: 'error',
      message: `Failed to get mail rule: ${error.message}`
    };
  }
}

/**
 * Format rule response
 * @param {Object} rule - Raw rule from Graph API
 * @returns {Object} - Formatted rule
 */
function formatRuleResponse(rule) {
  // Extract conditions
  const conditions = {};
  
  if (rule.conditions) {
    if (rule.conditions.bodyContains && rule.conditions.bodyContains.length > 0) {
      conditions.bodyContains = rule.conditions.bodyContains;
    }
    
    if (rule.conditions.bodyOrSubjectContains && rule.conditions.bodyOrSubjectContains.length > 0) {
      conditions.bodyOrSubjectContains = rule.conditions.bodyOrSubjectContains;
    }
    
    if (rule.conditions.categories && rule.conditions.categories.length > 0) {
      conditions.categories = rule.conditions.categories;
    }
    
    if (rule.conditions.fromAddresses && rule.conditions.fromAddresses.length > 0) {
      conditions.fromAddresses = rule.conditions.fromAddresses.map(address => ({
        name: address.emailAddress.name,
        email: address.emailAddress.address
      }));
    }
    
    if (rule.conditions.hasAttachments !== undefined) {
      conditions.hasAttachments = rule.conditions.hasAttachments;
    }
    
    if (rule.conditions.headerContains && rule.conditions.headerContains.length > 0) {
      conditions.headerContains = rule.conditions.headerContains;
    }
    
    if (rule.conditions.importance) {
      conditions.importance = rule.conditions.importance;
    }
    
    if (rule.conditions.isApprovalRequest !== undefined) {
      conditions.isApprovalRequest = rule.conditions.isApprovalRequest;
    }
    
    if (rule.conditions.isAutomaticForward !== undefined) {
      conditions.isAutomaticForward = rule.conditions.isAutomaticForward;
    }
    
    if (rule.conditions.isAutomaticReply !== undefined) {
      conditions.isAutomaticReply = rule.conditions.isAutomaticReply;
    }
    
    if (rule.conditions.isEncrypted !== undefined) {
      conditions.isEncrypted = rule.conditions.isEncrypted;
    }
    
    if (rule.conditions.isMeetingRequest !== undefined) {
      conditions.isMeetingRequest = rule.conditions.isMeetingRequest;
    }
    
    if (rule.conditions.isMeetingResponse !== undefined) {
      conditions.isMeetingResponse = rule.conditions.isMeetingResponse;
    }
    
    if (rule.conditions.isReadReceipt !== undefined) {
      conditions.isReadReceipt = rule.conditions.isReadReceipt;
    }
    
    if (rule.conditions.messageActionFlag) {
      conditions.messageActionFlag = rule.conditions.messageActionFlag;
    }
    
    if (rule.conditions.notSentToMe !== undefined) {
      conditions.notSentToMe = rule.conditions.notSentToMe;
    }
    
    if (rule.conditions.recipientContains && rule.conditions.recipientContains.length > 0) {
      conditions.recipientContains = rule.conditions.recipientContains;
    }
    
    if (rule.conditions.senderContains && rule.conditions.senderContains.length > 0) {
      conditions.senderContains = rule.conditions.senderContains;
    }
    
    if (rule.conditions.sensitivity) {
      conditions.sensitivity = rule.conditions.sensitivity;
    }
    
    if (rule.conditions.sentCcMe !== undefined) {
      conditions.sentCcMe = rule.conditions.sentCcMe;
    }
    
    if (rule.conditions.sentOnlyToMe !== undefined) {
      conditions.sentOnlyToMe = rule.conditions.sentOnlyToMe;
    }
    
    if (rule.conditions.sentToAddresses && rule.conditions.sentToAddresses.length > 0) {
      conditions.sentToAddresses = rule.conditions.sentToAddresses.map(address => ({
        name: address.emailAddress.name,
        email: address.emailAddress.address
      }));
    }
    
    if (rule.conditions.sentToMe !== undefined) {
      conditions.sentToMe = rule.conditions.sentToMe;
    }
    
    if (rule.conditions.sentToOrCcMe !== undefined) {
      conditions.sentToOrCcMe = rule.conditions.sentToOrCcMe;
    }
    
    if (rule.conditions.subjectContains && rule.conditions.subjectContains.length > 0) {
      conditions.subjectContains = rule.conditions.subjectContains;
    }
    
    if (rule.conditions.withinSizeRange) {
      conditions.withinSizeRange = rule.conditions.withinSizeRange;
    }
  }
  
  // Extract actions
  const actions = {};
  
  if (rule.actions) {
    if (rule.actions.assignCategories && rule.actions.assignCategories.length > 0) {
      actions.assignCategories = rule.actions.assignCategories;
    }
    
    if (rule.actions.copyToFolder) {
      actions.copyToFolder = rule.actions.copyToFolder;
    }
    
    if (rule.actions.delete !== undefined) {
      actions.delete = rule.actions.delete;
    }
    
    if (rule.actions.forwardAsAttachmentTo && rule.actions.forwardAsAttachmentTo.length > 0) {
      actions.forwardAsAttachmentTo = rule.actions.forwardAsAttachmentTo.map(address => ({
        name: address.emailAddress.name,
        email: address.emailAddress.address
      }));
    }
    
    if (rule.actions.forwardTo && rule.actions.forwardTo.length > 0) {
      actions.forwardTo = rule.actions.forwardTo.map(address => ({
        name: address.emailAddress.name,
        email: address.emailAddress.address
      }));
    }
    
    if (rule.actions.markAsRead !== undefined) {
      actions.markAsRead = rule.actions.markAsRead;
    }
    
    if (rule.actions.markImportance) {
      actions.markImportance = rule.actions.markImportance;
    }
    
    if (rule.actions.moveToFolder) {
      actions.moveToFolder = rule.actions.moveToFolder;
    }
    
    if (rule.actions.permanentDelete !== undefined) {
      actions.permanentDelete = rule.actions.permanentDelete;
    }
    
    if (rule.actions.redirectTo && rule.actions.redirectTo.length > 0) {
      actions.redirectTo = rule.actions.redirectTo.map(address => ({
        name: address.emailAddress.name,
        email: address.emailAddress.address
      }));
    }
    
    if (rule.actions.stopProcessingRules !== undefined) {
      actions.stopProcessingRules = rule.actions.stopProcessingRules;
    }
  }
  
  // Create formatted rule object
  return {
    id: rule.id,
    displayName: rule.displayName,
    sequence: rule.sequence,
    isEnabled: rule.isEnabled,
    hasError: rule.hasError,
    isReadOnly: rule.isReadOnly,
    conditions,
    actions
  };
}

export {
  listRulesHandler,
  getRuleHandler
};