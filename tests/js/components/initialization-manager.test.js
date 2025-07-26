/**
 * Tests for Initialization Manager Component
 */

const { 
    initializeSongSegmentation,
    initializeWebPlaybackSDK,
    isSongSegmentationInitialized,
    isWebPlaybackSDKInitialized,
    getInitializationStatus,
    resetInitializationState,
    resetAllInitializationStates,
    cleanupAllComponents,
    initializeAuthenticatedComponents
} = require('../../../js/components/initialization-manager.js');

// Mock the song segmentation component
jest.mock('../../../js/components/song-segmentation.js', () => ({
    initSongSegmentation: jest.fn()
}));

// Mock the web playback SDK component
jest.mock('../../../js/components/web-playback-sdk.js', () => ({
    initializeWebPlaybackSDK: jest.fn(),
    disconnectSDK: jest.fn()
}));

describe('Initialization Manager', () => {
    let mockSongSegmentationInit;
    let mockWebPlaybackSDKInit;
    let mockDisconnectSDK;
    let mockSpotifyAPI;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock spotifyAPI
        mockSpotifyAPI = {
            searchSongs: jest.fn(),
            getTrack: jest.fn(),
            playTrackEnhanced: jest.fn(),
            pauseEnhanced: jest.fn()
        };
        
        // Get mock functions
        const songSegmentationModule = require('../../../js/components/song-segmentation.js');
        const webPlaybackSDKModule = require('../../../js/components/web-playback-sdk.js');
        
        mockSongSegmentationInit = songSegmentationModule.initSongSegmentation;
        mockWebPlaybackSDKInit = webPlaybackSDKModule.initializeWebPlaybackSDK;
        mockDisconnectSDK = webPlaybackSDKModule.disconnectSDK;
        

        
        // Reset initialization states
        resetAllInitializationStates();
        
        // Set up default successful responses
        mockSongSegmentationInit.mockResolvedValue();
        mockWebPlaybackSDKInit.mockResolvedValue({ success: true, deviceId: 'test-device' });
        mockDisconnectSDK.mockResolvedValue();
    });

    describe('Song Segmentation Initialization', () => {
        test('should initialize song segmentation successfully', async () => {
            const result = await initializeSongSegmentation(mockSpotifyAPI);
            
            expect(result.success).toBe(true);
            expect(result.justInitialized).toBe(true);
            expect(mockSongSegmentationInit).toHaveBeenCalledTimes(1);
            expect(mockSongSegmentationInit).toHaveBeenCalledWith(mockSpotifyAPI);
            expect(isSongSegmentationInitialized()).toBe(true);
        });

        test('should not initialize song segmentation multiple times', async () => {
            // First initialization
            const result1 = await initializeSongSegmentation(mockSpotifyAPI);
            expect(result1.success).toBe(true);
            expect(result1.justInitialized).toBe(true);
            
            // Second initialization should skip
            const result2 = await initializeSongSegmentation(mockSpotifyAPI);
            expect(result2.success).toBe(true);
            expect(result2.alreadyInitialized).toBe(true);
            
            // Should only call the actual init function once
            expect(mockSongSegmentationInit).toHaveBeenCalledTimes(1);
        });

        test('should handle concurrent initialization requests', async () => {
            // Start multiple initializations simultaneously
            const promises = [
                initializeSongSegmentation(mockSpotifyAPI),
                initializeSongSegmentation(mockSpotifyAPI),
                initializeSongSegmentation(mockSpotifyAPI)
            ];
            
            const results = await Promise.all(promises);
            
            // All should succeed
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
            
            // Only one should be marked as "just initialized"
            const justInitialized = results.filter(r => r.justInitialized);
            expect(justInitialized).toHaveLength(1);
            
            // Should only call the actual init function once
            expect(mockSongSegmentationInit).toHaveBeenCalledTimes(1);
        });

        test('should handle initialization failure', async () => {
            const errorMessage = 'Initialization failed';
            mockSongSegmentationInit.mockRejectedValue(new Error(errorMessage));
            
            const result = await initializeSongSegmentation(mockSpotifyAPI);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe(errorMessage);
            expect(isSongSegmentationInitialized()).toBe(false);
        });

        test('should handle concurrent requests when initialization fails', async () => {
            const errorMessage = 'Initialization failed';
            mockSongSegmentationInit.mockRejectedValue(new Error(errorMessage));
            
            // Start multiple initializations simultaneously
            const promises = [
                initializeSongSegmentation(mockSpotifyAPI),
                initializeSongSegmentation(mockSpotifyAPI),
                initializeSongSegmentation(mockSpotifyAPI)
            ];
            
            const results = await Promise.all(promises);
            
            // All should fail with the same error
            results.forEach(result => {
                expect(result.success).toBe(false);
                expect(result.error).toBe(errorMessage);
            });
            
            // Should only call the actual init function once
            expect(mockSongSegmentationInit).toHaveBeenCalledTimes(1);
        });
    });

    describe('Web Playback SDK Initialization', () => {
        test('should initialize Web Playback SDK successfully', async () => {
            const result = await initializeWebPlaybackSDK();
            
            expect(result.success).toBe(true);
            expect(result.justInitialized).toBe(true);
            expect(result.deviceId).toBe('test-device');
            expect(mockWebPlaybackSDKInit).toHaveBeenCalledTimes(1);
            expect(isWebPlaybackSDKInitialized()).toBe(true);
        });

        test('should not initialize Web Playback SDK multiple times', async () => {
            // First initialization
            const result1 = await initializeWebPlaybackSDK();
            expect(result1.success).toBe(true);
            expect(result1.justInitialized).toBe(true);
            
            // Second initialization should skip
            const result2 = await initializeWebPlaybackSDK();
            expect(result2.success).toBe(true);
            expect(result2.alreadyInitialized).toBe(true);
            
            // Should only call the actual init function once
            expect(mockWebPlaybackSDKInit).toHaveBeenCalledTimes(1);
        });

        test('should handle Web Playback SDK initialization failure', async () => {
            const errorMessage = 'SDK initialization failed';
            mockWebPlaybackSDKInit.mockResolvedValue({ success: false, error: errorMessage });
            
            const result = await initializeWebPlaybackSDK();
            
            expect(result.success).toBe(false);
            expect(result.error).toBe(errorMessage);
            expect(isWebPlaybackSDKInitialized()).toBe(false);
        });
    });

    describe('Initialization Status', () => {
        test('should return correct initialization status', () => {
            const initialStatus = getInitializationStatus();
            
            expect(initialStatus.songSegmentation.initialized).toBe(false);
            expect(initialStatus.songSegmentation.initializing).toBe(false);
            expect(initialStatus.songSegmentation.error).toBe(null);
            
            expect(initialStatus.webPlaybackSDK.initialized).toBe(false);
            expect(initialStatus.webPlaybackSDK.initializing).toBe(false);
            expect(initialStatus.webPlaybackSDK.error).toBe(null);
        });

        test('should update status after initialization', async () => {
            await initializeSongSegmentation(mockSpotifyAPI);
            await initializeWebPlaybackSDK();
            
            const status = getInitializationStatus();
            
            expect(status.songSegmentation.initialized).toBe(true);
            expect(status.webPlaybackSDK.initialized).toBe(true);
        });
    });

    describe('State Reset', () => {
        test('should reset individual component state', async () => {
            // Initialize both components
            await initializeSongSegmentation(mockSpotifyAPI);
            await initializeWebPlaybackSDK();
            
            expect(isSongSegmentationInitialized()).toBe(true);
            expect(isWebPlaybackSDKInitialized()).toBe(true);
            
            // Reset only song segmentation
            resetInitializationState('songSegmentation');
            
            expect(isSongSegmentationInitialized()).toBe(false);
            expect(isWebPlaybackSDKInitialized()).toBe(true);
        });

        test('should reset all component states', async () => {
            // Initialize both components
            await initializeSongSegmentation(mockSpotifyAPI);
            await initializeWebPlaybackSDK();
            
            expect(isSongSegmentationInitialized()).toBe(true);
            expect(isWebPlaybackSDKInitialized()).toBe(true);
            
            // Reset all states
            resetAllInitializationStates();
            
            expect(isSongSegmentationInitialized()).toBe(false);
            expect(isWebPlaybackSDKInitialized()).toBe(false);
        });
    });

    describe('Component Cleanup', () => {
        test('should cleanup all components', async () => {
            // Initialize components
            await initializeSongSegmentation(mockSpotifyAPI);
            await initializeWebPlaybackSDK();
            
            expect(isSongSegmentationInitialized()).toBe(true);
            expect(isWebPlaybackSDKInitialized()).toBe(true);
            
            // Cleanup
            await cleanupAllComponents();
            
            expect(mockDisconnectSDK).toHaveBeenCalledTimes(1);
            expect(isSongSegmentationInitialized()).toBe(false);
            expect(isWebPlaybackSDKInitialized()).toBe(false);
        });

        test('should handle cleanup errors gracefully', async () => {
            await initializeWebPlaybackSDK();
            
            // Make disconnect fail
            mockDisconnectSDK.mockRejectedValue(new Error('Disconnect failed'));
            
            // Should not throw
            await expect(cleanupAllComponents()).resolves.not.toThrow();
            
            // Should still reset states
            expect(isWebPlaybackSDKInitialized()).toBe(false);
        });
    });

    describe('Authenticated Components Initialization', () => {
        test('should initialize authenticated components successfully', async () => {
            const result = await initializeAuthenticatedComponents(mockSpotifyAPI);
            
            expect(result.success).toBe(true);
            expect(result.songSegmentation.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(mockSongSegmentationInit).toHaveBeenCalledTimes(1);
        });

        test('should handle partial initialization failure', async () => {
            mockSongSegmentationInit.mockRejectedValue(new Error('Song segmentation failed'));
            
            const result = await initializeAuthenticatedComponents(mockSpotifyAPI);
            
            expect(result.success).toBe(false);
            expect(result.songSegmentation.success).toBe(false);
            expect(result.errors).toContain('Song segmentation: Song segmentation failed');
        });
    });

    describe('Manual Cleanup', () => {
        test('should cleanup components manually', async () => {
            // Initialize components
            await initializeSongSegmentation(mockSpotifyAPI);
            await initializeWebPlaybackSDK();
            
            expect(isSongSegmentationInitialized()).toBe(true);
            expect(isWebPlaybackSDKInitialized()).toBe(true);
            
            // Manually cleanup components
            await cleanupAllComponents();
            
            // Wait for async cleanup
            await new Promise(resolve => setTimeout(resolve, 0));
            
            expect(mockDisconnectSDK).toHaveBeenCalledTimes(1);
            expect(isSongSegmentationInitialized()).toBe(false);
            expect(isWebPlaybackSDKInitialized()).toBe(false);
        });
    });
});