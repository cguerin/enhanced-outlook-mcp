# Zod/JSON Schema Conversion Issues Analysis

## Problem Summary
The MCP SDK's `server.tool()` method expects a Zod RawShape (the object passed to z.object()), not a z.object() itself. The current implementation in `jsonSchemaToZodShape()` has issues handling complex types, particularly arrays of types like `['string', 'array']`.

## Affected Tools by Module

### Email Module (`email/index.js`)
1. **list_emails**
   - `orderBy`: type: `['object', 'string', 'array']`
   - `fields`: type: `['array', 'string']`

2. **search_emails** ⚠️ (User reported this doesn't work)
   - `fields`: type: `['array', 'string']`
   - `orderBy`: type: `['object', 'string', 'array']`

3. **send_email**
   - `to`: type: `['string', 'array']`
   - `cc`: type: `['string', 'array']`
   - `bcc`: type: `['string', 'array']`

4. **create_draft**
   - `to`: type: `['string', 'array']`
   - `cc`: type: `['string', 'array']`
   - `bcc`: type: `['string', 'array']`

5. **forward_email**
   - `to`: type: `['string', 'array']`

### Calendar Module (`calendar/index.js`)
1. **list_events**
   - `fields`: type: `['array', 'string']`

2. **create_event**
   - `location`: type: `['string', 'object']`
   - `attendees`: type: `['string', 'array']`

3. **update_event**
   - `location`: type: `['string', 'object']`
   - `attendees`: type: `['string', 'array']`

4. **find_meeting_times**
   - `attendees`: type: `['string', 'array']`
   - `locations`: array with items of type: `['string', 'object']`

### Folder Module (`folder/index.js`)
1. **list_folders**
   - `orderBy`: type: `['object', 'string', 'array']`

### Auth Module (`auth/index.js`)
- No multi-type fields found

### Rules Module (`rules/index.js`)
- No multi-type fields found

## Pattern Analysis

### Common Multi-Type Patterns
1. **String or Array**: `['string', 'array']`
   - Used for fields that accept either a single value or multiple values
   - Examples: recipients (to, cc, bcc), attendees, fields

2. **Object, String, or Array**: `['object', 'string', 'array']`
   - Used for complex ordering/sorting specifications
   - Example: orderBy

3. **String or Object**: `['string', 'object']`
   - Used for fields that can be simple strings or complex objects
   - Examples: location (can be string "Room 123" or object with details)

## Current Implementation Issue
The `jsonSchemaToZodShape()` function currently handles multi-type arrays by defaulting to `z.any()`:

```javascript
if (Array.isArray(value.type)) {
  // For simplicity, use z.any() for multi-type fields
  zodType = z.any();
}
```

This is too permissive and doesn't provide proper validation.

## Recommended Solution
Instead of using `z.any()`, we should use `z.union()` to properly handle multi-type fields:

```javascript
if (Array.isArray(value.type)) {
  const unionTypes = value.type.map(t => {
    switch(t) {
      case 'string': return z.string();
      case 'array': return z.array(z.any());
      case 'object': return z.object({});
      case 'number': return z.number();
      case 'boolean': return z.boolean();
      default: return z.any();
    }
  });
  zodType = z.union(unionTypes);
}
```

## Priority Fixes
1. **search_emails** - User reported this is broken
2. **list_emails** - Commonly used, has multiple affected fields
3. **send_email**, **create_draft**, **forward_email** - Core email functionality
4. **create_event**, **update_event** - Important calendar operations

## Testing Recommendations
After implementing the fix, test these specific scenarios:
1. Search emails with both string and array fields
2. Send email with single recipient (string) and multiple recipients (array)
3. Create event with string location and object location
4. Use orderBy with string, array, and object formats