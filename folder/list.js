import config from '../config.js';
import logger from '../utils/logger.js';
import { GraphApiClient } from '../utils/graph-api.js';
import { buildQueryParams } from '../utils/odata-helpers.js';

/**
 * List mail folders
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - List of folders
 */
async function listFoldersHandler(params = {}) {
  const userId = params.userId || 'default';
  const parentFolderId = params.parentFolderId;
  
  try {
    logger.info(`Listing mail folders for user ${userId}`);
    
    const graphClient = new GraphApiClient(userId);
    
    // Determine the endpoint based on whether a parent folder is specified
    let endpoint;
    if (parentFolderId) {
      endpoint = `/me/mailFolders/${parentFolderId}/childFolders`;
    } else {
      endpoint = '/me/mailFolders';
    }
    
    // Build query parameters
    const queryParams = buildQueryParams({
      top: params.limit || 100,
      select: ['id', 'displayName', 'parentFolderId', 'childFolderCount', 'totalItemCount', 'unreadItemCount'],
      filter: params.filter,
      orderBy: params.orderBy || { displayName: 'asc' }
    });
    
    // Get folders
    const response = await graphClient.get(endpoint, queryParams);
    
    if (!response || !response.value) {
      return {
        status: 'error',
        message: 'Failed to retrieve folders'
      };
    }
    
    const folders = response.value.map(folder => ({
      id: folder.id,
      name: folder.displayName,
      parentFolderId: folder.parentFolderId,
      childFolderCount: folder.childFolderCount,
      itemCount: folder.totalItemCount,
      unreadItemCount: folder.unreadItemCount
    }));
    
    return {
      status: 'success',
      count: folders.length,
      parentFolderId: parentFolderId || 'root',
      folders
    };
  } catch (error) {
    logger.error(`Error listing folders: ${error.message}`);
    
    return {
      status: 'error',
      message: `Failed to list folders: ${error.message}`
    };
  }
}

/**
 * Get information about a specific folder
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - Folder info
 */
async function getFolderHandler(params = {}) {
  const userId = params.userId || 'default';
  const folderId = params.folderId;
  
  if (!folderId) {
    return {
      status: 'error',
      message: 'Folder ID is required'
    };
  }
  
  try {
    logger.info(`Getting folder ${folderId} for user ${userId}`);
    
    const graphClient = new GraphApiClient(userId);
    
    // Determine the endpoint based on whether it's a well-known folder
    let endpoint;
    if (['inbox', 'drafts', 'sentitems', 'deleteditems'].includes(folderId.toLowerCase())) {
      endpoint = `/me/mailFolders/${folderId.toLowerCase()}`;
    } else {
      endpoint = `/me/mailFolders/${folderId}`;
    }
    
    // Get folder details with child folders and recent messages
    const folder = await graphClient.get(endpoint, {
      $expand: 'childFolders,messages($top=5;$orderby=receivedDateTime desc;$select=id,subject,from,receivedDateTime,isRead)'
    });
    
    if (!folder) {
      return {
        status: 'error',
        message: `Folder not found with ID: ${folderId}`
      };
    }
    
    // Format child folders
    const childFolders = folder.childFolders ? folder.childFolders.map(child => ({
      id: child.id,
      name: child.displayName,
      childFolderCount: child.childFolderCount,
      itemCount: child.totalItemCount,
      unreadItemCount: child.unreadItemCount
    })) : [];
    
    // Format recent messages
    const recentMessages = folder.messages ? folder.messages.map(message => ({
      id: message.id,
      subject: message.subject || '(No Subject)',
      sender: message.from ? {
        name: message.from.emailAddress.name,
        email: message.from.emailAddress.address
      } : null,
      receivedDateTime: message.receivedDateTime,
      isRead: message.isRead
    })) : [];
    
    // Build folder info response
    const folderInfo = {
      id: folder.id,
      name: folder.displayName,
      parentFolderId: folder.parentFolderId,
      childFolderCount: folder.childFolderCount,
      itemCount: folder.totalItemCount,
      unreadItemCount: folder.unreadItemCount,
      wellKnownName: folder.wellKnownName || null,
      childFolders,
      recentMessages
    };
    
    return {
      status: 'success',
      folder: folderInfo
    };
  } catch (error) {
    logger.error(`Error getting folder: ${error.message}`);
    
    return {
      status: 'error',
      message: `Failed to get folder: ${error.message}`
    };
  }
}

export {
  listFoldersHandler,
  getFolderHandler
};