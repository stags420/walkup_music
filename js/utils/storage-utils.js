/**
 * Storage utilities for managing data in local storage
 * Implements requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

// Storage keys
const STORAGE_KEYS = {
  PLAYERS: 'walkup_players',
  BATTING_ORDER: 'walkup_batting_order',
  SONG_SELECTIONS: 'walkup_song_selections',
  APP_STATE: 'walkup_app_state'
};

/**
 * Save data to local storage
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 * @returns {boolean} - True if save was successful, false if it failed
 */
function saveData(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving data to local storage:', error);
    
    // Handle storage quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Local storage quota exceeded. Attempting to free up space...');
      // Could implement more sophisticated cleanup here if needed
    }
    
    return false;
  }
}

/**
 * Retrieve data from local storage
 * @param {string} key - The key to retrieve data from
 * @param {any} defaultValue - Default value to return if key doesn't exist
 * @returns {any} - The retrieved data or defaultValue if not found
 */
function getData(key, defaultValue = null) {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error retrieving data from local storage:', error);
    return defaultValue;
  }
}

/**
 * Clear specific data from local storage
 * @param {string} key - The key to clear
 * @returns {boolean} - True if clear was successful
 */
function clearData(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing data from local storage:', error);
    return false;
  }
}

/**
 * Clear all application data from local storage
 * @returns {boolean} - True if clear was successful
 */
function clearAllData() {
  try {
    // Only clear our app-specific keys, not all localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing all data from local storage:', error);
    return false;
  }
}

/**
 * Check if local storage is available
 * @returns {boolean} - True if local storage is available
 */
function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get the approximate size of data in local storage (in bytes)
 * @param {string} key - The key to check size for
 * @returns {number} - Approximate size in bytes
 */
function getStorageSize(key) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return 0;
    
    // Calculate approximate size in bytes
    // Each character in a string is 2 bytes in JavaScript
    return data.length * 2;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
}

/**
 * Check if adding data would exceed storage limits
 * @param {string} key - The key to store data under
 * @param {any} data - The data to check
 * @returns {boolean} - True if data would fit, false if it would exceed limits
 */
function wouldFitInStorage(key, data) {
  try {
    // Typical localStorage limit is around 5-10MB
    // We'll use a conservative estimate of available space
    const serializedData = JSON.stringify(data);
    const dataSize = serializedData.length * 2; // 2 bytes per character
    
    // Try to set the data to see if it fits
    localStorage.setItem(key, serializedData);
    localStorage.removeItem(key);
    
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return false;
    }
    console.error('Error checking storage capacity:', error);
    return false;
  }
}

// Export the functions
module.exports = {
  STORAGE_KEYS,
  saveData,
  getData,
  clearData,
  clearAllData,
  isStorageAvailable,
  getStorageSize,
  wouldFitInStorage
};