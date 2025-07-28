/**
 * Component Visibility Utility Tests
 */

const { 
    showComponent, 
    hideComponent, 
    toggleComponent, 
    isComponentVisible, 
    showOnlyComponent,
    batchVisibilityUpdate 
} = require('../../../js/utils/component-visibility.js');

describe('Component Visibility Utility', () => {
    let mockElement;

    beforeEach(() => {
        // Create a mock DOM element
        mockElement = {
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn()
            }
        };

        // Mock document methods
        const mockQuerySelector = jest.fn().mockReturnValue(mockElement);
        const mockQuerySelectorAll = jest.fn().mockReturnValue([mockElement]);
        
        // Set both global.document and document
        global.document = {
            querySelector: mockQuerySelector,
            querySelectorAll: mockQuerySelectorAll
        };
        
        // Also set document directly for the tests
        document.querySelector = mockQuerySelector;
        document.querySelectorAll = mockQuerySelectorAll;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('showComponent', () => {
        test('should show component with default block display', () => {
            showComponent(mockElement);

            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('visible');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('visible-inline', 'visible-flex');
        });

        test('should show component with inline-block display', () => {
            showComponent(mockElement, 'inline-block');

            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('visible-inline');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('visible', 'visible-flex');
        });

        test('should show component with flex display', () => {
            showComponent(mockElement, 'flex');

            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('visible-flex');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('visible', 'visible-inline');
        });

        test('should work with selector string', () => {
            showComponent('.test-selector');

            expect(document.querySelector).toHaveBeenCalledWith('.test-selector');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
        });

        test('should handle null element gracefully', () => {
            document.querySelector.mockReturnValue(null);
            
            expect(() => showComponent('.non-existent')).not.toThrow();
        });
    });

    describe('hideComponent', () => {
        test('should hide component', () => {
            hideComponent(mockElement);

            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('visible', 'visible-inline', 'visible-flex');
        });

        test('should work with selector string', () => {
            hideComponent('.test-selector');

            expect(document.querySelector).toHaveBeenCalledWith('.test-selector');
            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
        });

        test('should handle null element gracefully', () => {
            document.querySelector.mockReturnValue(null);
            
            expect(() => hideComponent('.non-existent')).not.toThrow();
        });
    });

    describe('toggleComponent', () => {
        test('should show component when show is true', () => {
            toggleComponent(mockElement, true, 'flex');

            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('visible-flex');
        });

        test('should hide component when show is false', () => {
            toggleComponent(mockElement, false);

            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('visible', 'visible-inline', 'visible-flex');
        });
    });

    describe('isComponentVisible', () => {
        test('should return true when component is visible', () => {
            mockElement.classList.contains.mockReturnValue(false);

            const result = isComponentVisible(mockElement);

            expect(result).toBe(true);
            expect(mockElement.classList.contains).toHaveBeenCalledWith('hidden');
        });

        test('should return false when component is hidden', () => {
            mockElement.classList.contains.mockReturnValue(true);

            const result = isComponentVisible(mockElement);

            expect(result).toBe(false);
            expect(mockElement.classList.contains).toHaveBeenCalledWith('hidden');
        });

        test('should return false for null element', () => {
            const result = isComponentVisible(null);

            expect(result).toBe(false);
        });
    });

    describe('showOnlyComponent', () => {
        test('should hide all components in group and show only active one', () => {
            const mockElements = [
                { classList: { add: jest.fn(), remove: jest.fn() } },
                { classList: { add: jest.fn(), remove: jest.fn() } }
            ];
            
            document.querySelectorAll.mockReturnValue(mockElements);

            showOnlyComponent('.active', '.group', 'flex');

            // Should hide all components in group
            mockElements.forEach(el => {
                expect(el.classList.add).toHaveBeenCalledWith('hidden');
                expect(el.classList.remove).toHaveBeenCalledWith('visible', 'visible-inline', 'visible-flex');
            });

            // Should show the active component
            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('visible-flex');
        });
    });

    describe('batchVisibilityUpdate', () => {
        test('should perform multiple operations in batch', () => {
            const operations = [
                { element: mockElement, action: 'show', displayType: 'flex' },
                { element: mockElement, action: 'hide' }
            ];

            batchVisibilityUpdate(operations);

            // Should have performed both operations
            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('visible-flex');
            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
        });

        test('should handle toggle action', () => {
            mockElement.classList.contains.mockReturnValue(false); // Component is visible

            const operations = [
                { element: mockElement, action: 'toggle' }
            ];

            batchVisibilityUpdate(operations);

            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
        });
    });
});