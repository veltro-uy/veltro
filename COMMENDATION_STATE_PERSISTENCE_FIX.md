# Commendation State Persistence Fix

## Issue
When a user commendated another user's profile and then reloaded the page, the UI would not remember which commendations had already been given. This allowed users to attempt to submit the same commendations again, which would fail with a backend validation error.

## Solution Implemented

### Backend Changes

**File**: `app/Http/Controllers/UserCommendationController.php`

Modified the `index()` method to return which commendations the authenticated user has already given to the profile user:

```php
public function index(User $user): JsonResponse
{
    $response = [
        'stats' => $user->getCommendationStats(),
    ];

    // If user is authenticated, include which commendations they've given to this user
    if (Auth::check()) {
        $givenCommendations = UserCommendation::where('from_user_id', Auth::id())
            ->where('to_user_id', $user->id)
            ->pluck('category')
            ->toArray();

        $response['given_commendations'] = $givenCommendations;
    }

    return response()->json($response);
}
```

### Frontend Changes

**File**: `resources/js/components/commendation-dialog.tsx`

1. **Fetch existing commendations**: Modified `fetchExistingCommendations()` to properly parse and set the `given_commendations` from the API response:

```typescript
const fetchExistingCommendations = useCallback(async () => {
    if (!isOpen || !auth?.user) return;

    setLoading(true);
    try {
        const response = await fetch(`/api/users/${userId}/commendations`);
        if (!response.ok) {
            throw new Error('Error al cargar reconocimientos');
        }
        const data = await response.json();

        // Set the commendations that the current user has already given
        if (data.given_commendations) {
            setExistingCommendations(
                data.given_commendations as CommendationCategory[],
            );
        }
    } catch (error) {
        console.error('Error fetching commendations:', error);
    } finally {
        setLoading(false);
    }
}, [userId, isOpen, auth]);
```

2. **Refetch after submission**: After successfully submitting commendations, the dialog now refetches the existing commendations to ensure the state is accurate:

```typescript
if (succeeded.length > 0) {
    // ... existing code ...
    
    // Refetch existing commendations to ensure state is accurate
    await fetchExistingCommendations();
    setSelectedCategories([]);

    if (failed.length === 0) {
        onClose();
    }
}
```

3. **Fixed linter error**: Added `type="button"` to the category selection buttons.

### Testing

**File**: `tests/Feature/UserCommendationTest.php`

Added two new tests:

1. **Test that authenticated users can see their given commendations**:
   - Verifies that when user1 requests commendation stats for user2, they receive both the total stats and which commendations they personally have given
   - Ensures that commendations from other users are not included in the `given_commendations` array

2. **Test that guests can see stats but not given commendations**:
   - Verifies that unauthenticated users can still see commendation stats but don't receive the `given_commendations` field

## Results

✅ All 10 commendation tests passing  
✅ No linter errors  
✅ State persists across page reloads  
✅ UI correctly shows which commendations have already been given  
✅ Users cannot attempt to submit duplicate commendations from the UI  

## User Experience Improvements

1. **Persistent State**: The UI now remembers which commendations a user has given, even after page reload
2. **Better UX**: Users see disabled commendation buttons with "(Ya reconocido)" label immediately when opening the dialog
3. **Prevent Errors**: Users can no longer attempt to submit duplicate commendations, eliminating the error toast notification
4. **Accurate State**: After submitting commendations, the state is refetched from the backend to ensure accuracy

## API Changes

### GET `/api/users/{user}/commendations`

**Previous Response**:
```json
{
  "stats": {
    "friendly": 5,
    "skilled": 3,
    "teamwork": 8,
    "leadership": 2,
    "total": 18
  }
}
```

**New Response** (when authenticated):
```json
{
  "stats": {
    "friendly": 5,
    "skilled": 3,
    "teamwork": 8,
    "leadership": 2,
    "total": 18
  },
  "given_commendations": ["friendly", "skilled"]
}
```

**Note**: The `given_commendations` field is only included when the user is authenticated. Guest users still receive only the `stats` field, maintaining backward compatibility.

---

**Implementation Date**: January 28, 2026
