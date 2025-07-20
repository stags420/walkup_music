# Data Validation Patterns

## Validation Architecture

### Model-Level Validation
- Implement `validate()` method in all data models
- Return consistent `{isValid: boolean, errors: string[]}` structure
- Validate all required fields and constraints
- Provide specific, actionable error messages

### Input Validation
- Validate user inputs before creating models
- Check data types and formats
- Enforce business rules and constraints
- Sanitize inputs to prevent injection attacks

## Validation Rules

### String Validation
- Check for required fields (non-empty strings)
- Enforce length constraints (min/max characters)
- Validate format patterns when applicable
- Trim whitespace before validation

### Numeric Validation
- Verify data types (integer vs float)
- Check range constraints (min/max values)
- Handle edge cases (negative numbers, zero)
- Validate precision requirements

### Business Logic Validation
- Enforce domain-specific rules
- Check relationships between fields
- Validate against external constraints
- Ensure data consistency

## Error Handling

### Error Message Standards
- Use clear, user-friendly language
- Specify what's wrong and how to fix it
- Avoid technical jargon in user-facing messages
- Provide context for validation failures

### Error Aggregation
- Collect all validation errors before returning
- Group related errors logically
- Prioritize critical errors first
- Provide summary and detail levels

## Storage Validation

### Pre-Save Validation
- Validate data before attempting storage
- Check storage capacity constraints
- Verify data serialization compatibility
- Handle storage quota exceeded scenarios

### Data Integrity
- Validate data after retrieval from storage
- Handle corrupted or invalid stored data
- Provide migration paths for data format changes
- Implement data recovery mechanisms

## Performance Considerations

### Validation Efficiency
- Validate early and fail fast
- Cache validation results when appropriate
- Avoid redundant validation calls
- Use efficient validation algorithms

### Async Validation
- Handle validation that requires external calls
- Provide loading states during validation
- Implement timeout handling
- Cache validation results appropriately