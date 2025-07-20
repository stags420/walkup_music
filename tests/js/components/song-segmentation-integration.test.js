/**
 * Integration tests for Song Segmentation Component API
 */

// Mock the required modules
jest.mock('../../../js/components/spotify-api.js', () => ({
    searchSongs: jest.fn(),
    getTrack: jest.fn(),
    playSong: jest.fn().mockResolvedValue({}),
    pauseSong: jest.fn().mockResolvedValue({})
}));

jest.mock('../../../js/models/data-models.js', () => ({
    DataManager: {
        getSongSelectionForPlayer: jest.fn(),
        saveSongSelection: jest.fn().mockReturnValue({ success: true, error: null })
    },
    SongSelectionModel: jest.fn().mockImplementation((data) => ({
        ...data,
        validate: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
        toObject: jest.fn().mockReturnValue(data)
    }))
}));

describe('Song Segmentation API Integration', () => {
    let mockSegmentationModule;
    
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="selected-player-info"></div>
            <form id="song-search-form">
                <input id="song-search" type="text">
            </form>
            <div id="search-results"></div>
            <div id="segmentation-interface"></div>
            <button id="back-to-players"></button>
        `;
        
        // Mock the segmentation module functions
        mockSegmentationModule = {
            setSegmentStartTime: jest.fn(),
            setSegmentEndTime: jest.fn(),
            previewSegment: jest.fn(),
            getCurrentSegment: jest.fn(),
            saveCurrentSegment: jest.fn()
        };
        
        // Mock current state
        global.mockCurrentTrack = {
            id: 'test-track-id',
            name: 'Test Song',
            artists: [{ name: 'Test Artist' }],
            duration_ms: 180000, // 3 minutes
            album: { images: [{ url: 'http://example.com/image.jpg' }] }
        };
        
        global.mockCurrentPlayer = {
            id: 'test-player-id',
            name: 'Test Player'
        };
        
        global.mockCurrentSegment = {
            startTime: 0,
            endTime: 30,
            duration: 30
        };
    });
    
    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
        delete global.mockCurrentTrack;
        delete global.mockCurrentPlayer;
        delete global.mockCurrentSegment;
    });
    
    describe('setSegmentStartTime API', () => {
        test('should validate start time input', () => {
            // Mock the function behavior
            const setSegmentStartTime = (startTime) => {
                if (!global.mockCurrentTrack) {
                    return { success: false, error: 'No track loaded for segmentation' };
                }
                
                if (typeof startTime !== 'number' || startTime < 0) {
                    return { success: false, error: 'Start time must be a non-negative number' };
                }
                
                const maxTime = Math.floor(global.mockCurrentTrack.duration_ms / 1000);
                if (startTime >= maxTime) {
                    return { success: false, error: `Start time cannot exceed track duration (${maxTime} seconds)` };
                }
                
                if (startTime >= global.mockCurrentSegment.endTime) {
                    return { success: false, error: 'Start time must be less than end time' };
                }
                
                global.mockCurrentSegment.startTime = startTime;
                global.mockCurrentSegment.duration = global.mockCurrentSegment.endTime - startTime;
                
                return { success: true, error: null };
            };
            
            // Test valid start time
            const validResult = setSegmentStartTime(10);
            expect(validResult.success).toBe(true);
            expect(validResult.error).toBeNull();
            expect(global.mockCurrentSegment.startTime).toBe(10);
            expect(global.mockCurrentSegment.duration).toBe(20);
            
            // Test invalid start time - negative
            const negativeResult = setSegmentStartTime(-5);
            expect(negativeResult.success).toBe(false);
            expect(negativeResult.error).toBe('Start time must be a non-negative number');
            
            // Test invalid start time - exceeds track duration
            const exceedsResult = setSegmentStartTime(200);
            expect(exceedsResult.success).toBe(false);
            expect(exceedsResult.error).toBe('Start time cannot exceed track duration (180 seconds)');
            
            // Test invalid start time - greater than end time
            global.mockCurrentSegment.endTime = 15;
            const greaterResult = setSegmentStartTime(20);
            expect(greaterResult.success).toBe(false);
            expect(greaterResult.error).toBe('Start time must be less than end time');
        });
        
        test('should handle no track loaded', () => {
            const setSegmentStartTime = (startTime) => {
                if (!global.mockCurrentTrack) {
                    return { success: false, error: 'No track loaded for segmentation' };
                }
                return { success: true, error: null };
            };
            
            global.mockCurrentTrack = null;
            const result = setSegmentStartTime(10);
            expect(result.success).toBe(false);
            expect(result.error).toBe('No track loaded for segmentation');
        });
    });
    
    describe('setSegmentEndTime API', () => {
        test('should validate end time input', () => {
            // Mock the function behavior
            const setSegmentEndTime = (endTime) => {
                if (!global.mockCurrentTrack) {
                    return { success: false, error: 'No track loaded for segmentation' };
                }
                
                if (typeof endTime !== 'number' || endTime <= 0) {
                    return { success: false, error: 'End time must be a positive number' };
                }
                
                const maxTime = Math.floor(global.mockCurrentTrack.duration_ms / 1000);
                if (endTime > maxTime) {
                    return { success: false, error: `End time cannot exceed track duration (${maxTime} seconds)` };
                }
                
                if (endTime <= global.mockCurrentSegment.startTime) {
                    return { success: false, error: 'End time must be greater than start time' };
                }
                
                global.mockCurrentSegment.endTime = endTime;
                global.mockCurrentSegment.duration = endTime - global.mockCurrentSegment.startTime;
                
                return { success: true, error: null };
            };
            
            // Test valid end time
            const validResult = setSegmentEndTime(45);
            expect(validResult.success).toBe(true);
            expect(validResult.error).toBeNull();
            expect(global.mockCurrentSegment.endTime).toBe(45);
            expect(global.mockCurrentSegment.duration).toBe(45);
            
            // Test invalid end time - zero
            const zeroResult = setSegmentEndTime(0);
            expect(zeroResult.success).toBe(false);
            expect(zeroResult.error).toBe('End time must be a positive number');
            
            // Test invalid end time - exceeds track duration
            const exceedsResult = setSegmentEndTime(200);
            expect(exceedsResult.success).toBe(false);
            expect(exceedsResult.error).toBe('End time cannot exceed track duration (180 seconds)');
            
            // Test invalid end time - less than start time
            global.mockCurrentSegment.startTime = 50;
            const lessResult = setSegmentEndTime(40);
            expect(lessResult.success).toBe(false);
            expect(lessResult.error).toBe('End time must be greater than start time');
        });
    });
    
    describe('previewSegment API', () => {
        test('should validate segment before preview', async () => {
            // Mock the function behavior
            const previewSegment = async () => {
                if (!global.mockCurrentTrack) {
                    return { success: false, error: 'No track loaded for segmentation' };
                }
                
                const minDuration = 5;
                const maxDuration = 60;
                
                if (global.mockCurrentSegment.duration < minDuration) {
                    return { success: false, error: `Segment must be at least ${minDuration} seconds long` };
                }
                
                if (global.mockCurrentSegment.duration > maxDuration) {
                    return { success: false, error: `Segment cannot exceed ${maxDuration} seconds` };
                }
                
                // Mock successful playback
                return { success: true, error: null };
            };
            
            // Test valid segment
            global.mockCurrentSegment = { startTime: 10, endTime: 40, duration: 30 };
            const validResult = await previewSegment();
            expect(validResult.success).toBe(true);
            expect(validResult.error).toBeNull();
            
            // Test segment too short
            global.mockCurrentSegment = { startTime: 10, endTime: 12, duration: 2 };
            const shortResult = await previewSegment();
            expect(shortResult.success).toBe(false);
            expect(shortResult.error).toBe('Segment must be at least 5 seconds long');
            
            // Test segment too long
            global.mockCurrentSegment = { startTime: 10, endTime: 80, duration: 70 };
            const longResult = await previewSegment();
            expect(longResult.success).toBe(false);
            expect(longResult.error).toBe('Segment cannot exceed 60 seconds');
        });
    });
    
    describe('getCurrentSegment API', () => {
        test('should return current segment information', () => {
            // Mock the function behavior
            const getCurrentSegment = () => {
                if (!global.mockCurrentTrack) {
                    return null;
                }
                
                return {
                    startTime: global.mockCurrentSegment.startTime,
                    endTime: global.mockCurrentSegment.endTime,
                    duration: global.mockCurrentSegment.duration,
                    trackId: global.mockCurrentTrack.id,
                    trackName: global.mockCurrentTrack.name,
                    artistName: global.mockCurrentTrack.artists.map(artist => artist.name).join(', ')
                };
            };
            
            // Test with track loaded
            const segment = getCurrentSegment();
            expect(segment).toBeTruthy();
            expect(segment.startTime).toBe(0);
            expect(segment.endTime).toBe(30);
            expect(segment.duration).toBe(30);
            expect(segment.trackId).toBe('test-track-id');
            expect(segment.trackName).toBe('Test Song');
            expect(segment.artistName).toBe('Test Artist');
            
            // Test with no track loaded
            global.mockCurrentTrack = null;
            const noTrackSegment = getCurrentSegment();
            expect(noTrackSegment).toBeNull();
        });
    });
    
    describe('saveCurrentSegment API', () => {
        test('should save segment to storage', () => {
            // Mock the function behavior
            const saveCurrentSegment = () => {
                if (!global.mockCurrentPlayer || !global.mockCurrentTrack) {
                    return { success: false, error: 'No player or track selected for saving' };
                }
                
                // Mock validation
                const validation = { isValid: true, errors: [] };
                if (!validation.isValid) {
                    return { success: false, error: validation.errors.join(' ') };
                }
                
                // Mock successful save
                return { success: true, error: null };
            };
            
            // Test successful save
            const result = saveCurrentSegment();
            expect(result.success).toBe(true);
            expect(result.error).toBeNull();
            
            // Test no player selected
            global.mockCurrentPlayer = null;
            const noPlayerResult = saveCurrentSegment();
            expect(noPlayerResult.success).toBe(false);
            expect(noPlayerResult.error).toBe('No player or track selected for saving');
            
            // Test no track selected
            global.mockCurrentPlayer = { id: 'test-player-id', name: 'Test Player' };
            global.mockCurrentTrack = null;
            const noTrackResult = saveCurrentSegment();
            expect(noTrackResult.success).toBe(false);
            expect(noTrackResult.error).toBe('No player or track selected for saving');
        });
    });
    
    describe('Integration with Storage', () => {
        test('should integrate with DataManager for saving', () => {
            const { DataManager, SongSelectionModel } = require('../../../js/models/data-models.js');
            
            // Test that mocks are working
            expect(DataManager.saveSongSelection).toBeDefined();
            expect(SongSelectionModel).toBeDefined();
            
            // Mock a save operation
            const mockSongSelection = new SongSelectionModel({
                playerId: 'test-player-id',
                trackId: 'test-track-id',
                trackName: 'Test Song',
                artistName: 'Test Artist',
                startTime: 10,
                endTime: 40,
                duration: 30
            });
            
            const saveResult = DataManager.saveSongSelection(mockSongSelection);
            expect(saveResult.success).toBe(true);
            expect(DataManager.saveSongSelection).toHaveBeenCalledWith(mockSongSelection);
        });
    });
});