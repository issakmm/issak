# NearbyTalk - Anonymous Local Social Feed App

## Original Problem Statement
Build an app like Yik Yak but for city and university - an anonymous local social feed app with:
- Both city and university feeds (users can switch between them)
- Basic features: Anonymous posts, upvotes/downvotes, comments
- University email verification (.edu domains) - non-.edu users can still join but only see city feed

## Architecture

### Backend (FastAPI + MongoDB)
- **Authentication**: JWT-based auth with email verification
- **Collections**: users, posts, comments, votes
- **Key Feature**: `has_university_access` flag - true for .edu emails, false otherwise

### Frontend (React + Tailwind)
- **Design**: Minimal dark theme (#111315 background, #4C6FFF accent)
- **Conditional UI**: Toggle only shown to .edu users; non-.edu users see city-only header

## User Types
1. **.edu Users**: Full access to both university and city feeds with toggle
2. **Non-.edu Users**: City-only access, no university toggle shown

## What's Been Implemented (Jan 2026)
- [x] Any email registration (not just .edu)
- [x] Conditional university access based on email type
- [x] City-only UI for non-.edu users
- [x] Full toggle for .edu users
- [x] Anonymous posting, voting, comments
- [x] Minimal dark theme redesign

## Next Tasks
1. Integrate email service for verification codes
2. Add post reporting/moderation
3. Implement location-based feed filtering
