// folder/create.js
import { GraphApiClient } from '../utils/graph-api.js';
import logger from '../utils/logger.js';

async function createFolderHandler(params = {}) {
  const { userId = 'default', name, parentFolderId } = params;
  if (!name) return { status: 'error', message: 'Folder name required' };

  try {
    logger.info(`Creating folder "${name}" for user ${userId}`);
    const graphClient = new GraphApiClient(userId);
    
    const endpoint = parentFolderId 
      ? `/me/mailFolders/${parentFolderId}/childFolders`
      : '/me/mailFolders';
      
    const folder = await graphClient.post(endpoint, { displayName: name });
    
    return {
      status: 'success',
      message: 'Folder created successfully',
      folder: { 
        id: folder.id, 
        name: folder.displayName,
        parentFolderId: folder.parentFolderId,
        itemCount: folder.totalItemCount
      }
    };
  } catch (error) {
    logger.error(`Error creating folder: ${error.message}`);
    return { status: 'error', message: `Failed to create folder: ${error.message}` };
  }
}

async function updateFolderHandler(params = {}) {
  const { userId = 'default', folderId, name } = params;
  
  if (!folderId) {
    return { status: 'error', message: 'Folder ID required' };
  }
  
  if (!name) {
    return { status: 'error', message: 'New folder name required' };
  }

  try {
    logger.info(`Updating folder ${folderId} for user ${userId}`);
    const graphClient = new GraphApiClient(userId);
    
    const updatedFolder = await graphClient.patch(`/me/mailFolders/${folderId}`, {
      displayName: name
    });
    
    return {
      status: 'success',
      message: 'Folder updated successfully',
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.displayName
      }
    };
  } catch (error) {
    logger.error(`Error updating folder: ${error.message}`);
    return { status: 'error', message: `Failed to update folder: ${error.message}` };
  }
}

async function deleteFolderHandler(params = {}) {
  const { userId = 'default', folderId } = params;
  
  if (!folderId) {
    return { status: 'error', message: 'Folder ID required' };
  }

  try {
    logger.info(`Deleting folder ${folderId} for user ${userId}`);
    const graphClient = new GraphApiClient(userId);
    
    await graphClient.delete(`/me/mailFolders/${folderId}`);
    
    return {
      status: 'success',
      message: 'Folder deleted successfully',
      folderId
    };
  } catch (error) {
    logger.error(`Error deleting folder: ${error.message}`);
    return { status: 'error', message: `Failed to delete folder: ${error.message}` };
  }
}

export { createFolderHandler, updateFolderHandler, deleteFolderHandler };