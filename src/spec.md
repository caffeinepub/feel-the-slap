# FEEL THE SLAP.COM

## Current State
New project - no existing codebase.

## Requested Changes (Diff)

### Add
- **Complete social media platform** with nostalgic 2000s teen aesthetic
- **User Authentication System**: signup with username/email/password, username availability validation, password strength requirements (8+ chars, 1 number, 1 special char), login/logout, forgot password flow
- **Age Verification**: DOB capture during signup, 18+ content gating, age-based access control
- **Posts System**: text/image posts, anonymous posting toggle, timestamps, inline comments with nested replies, reaction system (heart, slap, cry, fire, vibe), infinite scroll feed
- **Emotional Tracking**: comprehensive emotion dropdowns organized by 17 categories (Calm/Centered, Joy/Excitement, Angry/Annoyed, etc.), body sensations dropdown with 50+ options
- **Profile Pages**: username, avatar, mini bio, post history, mood tracker showing last emotion + body sensation, public/private toggle
- **18+ Section**: darker aesthetic, age-restricted content, same full functionality as main feed
- **Interactive Features**: "Random Slap" button, live reaction updates, dynamic comment loading, pop-up notifications, marquee banners
- **Sidebar Widgets**: left (Your Notes, Top Slaps, Random Confessions), right (friends list, Mood Selector, post activity calendar)
- **2000s Design Elements**: neon + pastel colors, grungy textures, pixel fonts, small doodles/gifs, 8-bit background music, hover animations on buttons/avatars

### Modify
N/A - new project

### Remove
N/A - new project

## Implementation Plan

### Backend
1. **User Management**: user registration with username uniqueness check, email validation, password hashing, DOB storage for age verification, login/logout sessions, password reset tokens
2. **Posts CRUD**: create posts (text/image, anonymous flag), read posts with pagination, update posts, delete posts, filter by age-appropriate content
3. **Reactions System**: add/remove reactions (5 types), get reaction counts per post, track user reactions
4. **Comments System**: create comments with nested replies, get comments for posts, delete comments
5. **Emotion & Sensation Tracking**: store user's selected emotion and body sensation per post or profile update, retrieve mood history
6. **Profile Management**: get user profile, update bio/avatar, set public/private visibility, get post history
7. **Content Filtering**: age-based content filtering (18+ flag on posts), random post selection
8. **Image Upload**: blob storage for avatars and post images

### Frontend
1. **Authentication Pages**: signup form with live validation (username availability, password strength, age verification), login form with error handling, forgot password flow
2. **Main Layout**: header with FEEL THE SLAP logo (dripping/pixel 3D style), tagline, auth buttons; three-column layout (left sidebar, central feed, right sidebar); footer with links; marquee banner
3. **Feed Page**: infinite scroll post cards, each showing username, timestamp, content, emotion/sensation tags, reaction buttons, inline comments, anonymous indicator
4. **Post Creation**: form with text/image input, anonymous toggle, emotion dropdown (17 categories), body sensation dropdown (50+ options), submit validation
5. **18+ Section**: separate route with darker theme, age gate check, same post functionality
6. **Profile Pages**: display user info, mood tracker visualization, post history grid, edit profile modal, public/private toggle
7. **Sidebar Widgets**: Your Notes (personal saved posts), Top Slaps (trending posts), Random Confessions, Friends List, Mood Selector (quick emotion picker), Activity Calendar (heatmap of post activity)
8. **Interactions**: live reaction updates without page reload, nested comment threads, "Random Slap" button, pop-up notifications system
9. **2000s Aesthetic**: custom CSS with neon/pastel color palette, grungy background textures, pixel/dripping fonts, decorative GIFs and doodles, hover animations (shake, glow, bounce), optional 8-bit background music player
10. **Responsive Design**: mobile-friendly layout with collapsible sidebars
11. **Error Handling**: inline error messages for all forms, empty post prevention, image size validation, age restriction warnings

### Data Models
- **User**: username, email, passwordHash, dateOfBirth, avatar, bio, isProfilePublic, lastEmotion, lastBodySensation, createdAt
- **Post**: authorId, content, imageUrl, isAnonymous, emotion, bodySensation, is18Plus, createdAt, reactions (map of reactionType -> count), commentCount
- **Comment**: postId, authorId, content, parentCommentId (for nesting), createdAt
- **Reaction**: postId, userId, reactionType (heart/slap/cry/fire/vibe)

## UX Notes
- **2000s Nostalgia**: maximize visual chaos with clashing fonts, animated GIFs, marquee text, neon borders, and grungy overlays
- **Emotional Expression**: make emotion/sensation selection central to posting experience - prominent dropdowns with clear categories
- **Age Safety**: strict age gating for 18+ content - verify DOB during signup, block under-18 users from seeing/creating adult content
- **Anonymous Posting**: clear toggle for anonymity, show "Anonymous User" instead of username when enabled
- **Live Interactions**: reactions and comments should update in real-time feel without requiring page refresh
- **Error Feedback**: all validation errors appear inline near the relevant field with clear messaging
- **Hover Delight**: buttons, avatars, and interactive elements should have playful hover effects (shake, glow, scale)
- **Infinite Scroll**: seamless loading of more posts as user scrolls down feed
- **Mobile Responsive**: maintain 2000s aesthetic while ensuring usability on mobile (collapsible sidebars, touch-friendly buttons)
