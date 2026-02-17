# NearbyTalk - Anonymous Local Social Feed App (Yik Yak Clone)

## Original Problem Statement
Build an app like Yik Yak but for city and university - an anonymous local social feed app with:
- Both city and university feeds (users can switch between them)
- Basic features: Anonymous posts, upvotes/downvotes, comments
- University email verification (.edu domains)

## Architecture

### Backend (FastAPI + MongoDB)
- **Authentication**: JWT-based auth with .edu email verification
- **Collections**: users, posts, comments, votes
- **Endpoints**: 
  - POST /api/auth/register - Register with .edu email
  - POST /api/auth/verify - Verify email with 6-digit code
  - POST /api/auth/login - Login
  - GET /api/posts - Get posts by feed type (university/city) and sort (new/hot)
  - POST /api/posts - Create anonymous post
  - POST /api/posts/{id}/vote - Upvote/downvote post
  - GET/POST /api/posts/{id}/comments - Get/create comments
  - POST /api/comments/{id}/vote - Vote on comments

### Frontend (React + Tailwind)
- **Pages**: LandingPage, FeedPage, PostDetailPage
- **Design**: Neo-Brutalist "Electric Campus" theme
- **Features**: Feed toggle (Uni/City), voting, comments, anonymous posting

## User Personas
1. **College Students**: Share campus thoughts anonymously
2. **City Dwellers**: Discover local happenings

## Core Requirements
- [x] .edu email verification for registration
- [x] Anonymous posting (no usernames displayed)
- [x] University feed (same university users)
- [x] City feed (same city users)
- [x] Upvote/downvote on posts and comments
- [x] Comment threads
- [x] Karma system
- [x] Feed sorting (new/hot)

## What's Been Implemented (Jan 2026)
- Full auth flow with .edu verification
- Post creation and feed views
- Voting system with karma
- Comment system
- Responsive Neo-Brutalist UI
- University/City feed toggle

## Prioritized Backlog
### P0 (Critical)
- All core features implemented ✓

### P1 (Important)
- Email sending integration for verification
- Post reporting/flagging
- User blocking

### P2 (Nice to Have)
- Push notifications
- Trending posts section
- Location radius settings
- Post expiration (24h)

## Next Tasks
1. Integrate email service for verification codes (currently shown in response)
2. Add reporting/moderation features
3. Implement post expiration
