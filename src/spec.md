# Feel The Slap - Signup Fix & Email/Phone Optional

## Current State

The signup flow currently:
- Requires username, email, password, and date of birth
- Uses Internet Identity for authentication (redirects to id.ai)
- Shows "error" when users try to sign up
- Email field is required in UserProfile backend type

## Requested Changes (Diff)

### Add
- Post-signup dismissible banner that prompts for email and phone (for account recovery)
- Phone number field in UserProfile (optional)
- Email update functionality in profile settings
- Phone number update functionality in profile settings

### Modify
- Remove email field from signup form (username + password + DOB only)
- Make email field optional in UserProfile backend type (Text → ?Text)
- Fix signup error - ensure Internet Identity flow completes successfully
- Keep users on-site during signup (minimize visible redirect to id.ai)
- After successful signup, show dismissible banner prompting for email/phone with:
  - Friendly warning about account recovery
  - Form to add email and phone immediately
  - "Add Later" button to dismiss
  - "Save" button to update profile with email/phone

### Remove
- Email requirement from initial signup

## Implementation Plan

### Backend
1. Update UserProfile type:
   - Change `email: Text` to `email: ?Text`
   - Add `phoneNumber: ?Text` field
2. Update site owner check to handle optional email field
3. All other backend logic remains unchanged

### Frontend
1. Fix SignupPage:
   - Remove email field from form
   - Keep username, password, date of birth
   - Fix Internet Identity authentication flow
   - Handle errors properly with clear messages
   - After successful registration, redirect to feed with post-signup banner

2. Create PostSignupBanner component:
   - Dismissible banner (appears once after first signup)
   - Shows at top of feed page
   - Contains:
     - Warning text: "⚠️ Add your email and phone to recover your account if you forget your password!"
     - Email input field (validated)
     - Phone number input field (validated)
     - "Save" button → updates profile
     - "Add Later" button → dismisses banner (can add in settings later)
   - 2000s aesthetic styling (matches site theme)
   - Use localStorage to track if user has seen banner

3. Update ProfilePage settings section:
   - Add email field (if not already set)
   - Add phone number field
   - Allow users to update these fields anytime

4. Fix authentication errors:
   - Add better error handling for Internet Identity
   - Show specific error messages for different failure cases
   - Ensure signup completes without visible redirects

## UX Notes

- Signup is now just 3 fields: username, password, date of birth
- Internet Identity auth happens in background/popup (minimize disruption)
- Post-signup banner is helpful but non-blocking
- Users can dismiss and add email/phone later in settings
- Clear error messages guide users if something fails
- No jarring redirects to external id.ai site (use iframe/popup if possible)
