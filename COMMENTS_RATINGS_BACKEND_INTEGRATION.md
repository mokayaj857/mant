# Comments and Ratings Backend Integration Guide

This document provides guidelines for integrating the frontend comment and rating functionality with a backend API.

## Overview

The comment and rating feature allows users who have minted tickets for an event to:
- View comments and ratings from other attendees
- Add their own comments about the event
- Rate the event organizer (1-5 stars)
- Preview comments and ratings before minting a ticket

## Frontend Implementation

### Components
- **CommentRatingSection** (`src/components/CommentRatingSection.jsx`): Main component for displaying and managing comments/ratings
- **MintNFT** (`src/pages/MintNFT.jsx`): Integrated with 5-step progress including comments section
- **Ticket** (`src/pages/Ticket.jsx`): Includes "Comment on Event" button to navigate to comment section

### Current Mock Data Storage
Currently, the frontend uses `localStorage` for mock data:
- Comments: `localStorage.getItem('comments_${eventId}')`
- Ratings: `localStorage.getItem('ratings_${eventId}')`

## Required Backend API Endpoints

### 1. Get Comments and Ratings for an Event

**Endpoint:** `GET /api/events/{eventId}/comments-ratings`

**Description:** Retrieve all comments and ratings for a specific event

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "userId": "user_wallet_address",
        "userName": "Alice Johnson",
        "userWallet": "0x1234...5678",
        "comment": "Amazing event! The organization was top-notch.",
        "createdAt": "2024-12-08T10:30:00Z",
        "verified": true
      }
    ],
    "ratings": [
      {
        "id": 1,
        "userId": "user_wallet_address",
        "userName": "Alice Johnson",
        "rating": 5,
        "createdAt": "2024-12-08T10:30:00Z"
      }
    ],
    "averageRating": 4.5,
    "totalRatings": 10
  }
}
```

**Frontend Integration Point:**
- File: `src/components/CommentRatingSection.jsx`
- Function: `fetchCommentsAndRatings()`
- Line: ~30-70

**Code to Replace:**
```javascript
// Replace this mock implementation:
const storedComments = localStorage.getItem(`comments_${eventId}`);
const storedRatings = localStorage.getItem(`ratings_${eventId}`);

// With actual API call:
const response = await fetch(`/api/events/${eventId}/comments-ratings`);
const data = await response.json();
setComments(data.data.comments);
setRatings(data.data.ratings);
setAverageRating(data.data.averageRating);
```

### 2. Add Comment

**Endpoint:** `POST /api/events/{eventId}/comments`

**Description:** Add a new comment for an event (only for verified ticket holders)

**Request Body:**
```json
{
  "userId": "user_wallet_address",
  "userName": "Current User",
  "comment": "This was an incredible experience!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "userId": "user_wallet_address",
    "userName": "Current User",
    "userWallet": "0xYour...Wallet",
    "comment": "This was an incredible experience!",
    "createdAt": "2024-12-09T15:45:00Z",
    "verified": true
  }
}
```

**Frontend Integration Point:**
- File: `src/components/CommentRatingSection.jsx`
- Function: `handleSubmitComment()`
- Line: ~75-105

**Code to Replace:**
```javascript
// Replace this mock implementation:
const comment = {
  id: Date.now(),
  userName: 'Current User',
  // ...
};
localStorage.setItem(`comments_${eventId}`, JSON.stringify(updatedComments));

// With actual API call:
const response = await fetch(`/api/events/${eventId}/comments`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}` // Add authentication
  },
  body: JSON.stringify({ 
    userId: walletAddress,
    userName: userName,
    comment: newComment 
  })
});
const data = await response.json();
setComments(prev => [...prev, data.data]);
```

### 3. Add Rating

**Endpoint:** `POST /api/events/{eventId}/ratings`

**Description:** Add a rating for an event organizer (only for verified ticket holders)

**Request Body:**
```json
{
  "userId": "user_wallet_address",
  "userName": "Current User",
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "userId": "user_wallet_address",
    "userName": "Current User",
    "rating": 5,
    "createdAt": "2024-12-09T15:45:00Z"
  },
  "averageRating": 4.6,
  "totalRatings": 11
}
```

**Frontend Integration Point:**
- File: `src/components/CommentRatingSection.jsx`
- Function: `handleSubmitRating()`
- Line: ~107-140

**Code to Replace:**
```javascript
// Replace this mock implementation:
const rating = {
  id: Date.now(),
  userName: 'Current User',
  rating: newRating,
  // ...
};
localStorage.setItem(`ratings_${eventId}`, JSON.stringify(updatedRatings));

// With actual API call:
const response = await fetch(`/api/events/${eventId}/ratings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}` // Add authentication
  },
  body: JSON.stringify({
    userId: walletAddress,
    userName: userName,
    rating: newRating
  })
});
const data = await response.json();
setRatings(prev => [...prev, data.data]);
setAverageRating(data.averageRating);
```

## Backend Requirements

### Authentication & Authorization

1. **Verify Ticket Ownership**
   - Before allowing a user to comment or rate, verify they own a valid ticket for the event
   - Check against blockchain records or your ticket database
   - Ensure the ticket is minted and valid

2. **Prevent Duplicate Ratings**
   - Each user should only be able to rate an event once
   - Check if user has already submitted a rating before accepting new ones
   - Allow users to update their existing rating

3. **Verify Attendee Status**
   - Mark comments/ratings as "verified" only if the user has actually attended the event
   - This could be based on check-in status or event date

### Database Schema Suggestions

#### Comments Table
```sql
CREATE TABLE event_comments (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_wallet VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);
```

#### Ratings Table
```sql
CREATE TABLE event_ratings (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);
```

### Business Logic

1. **Comment Validation**
   - Minimum length: 10 characters
   - Maximum length: 1000 characters
   - Filter profanity/spam
   - Rate limiting: Max 1 comment per event per user

2. **Rating Validation**
   - Must be integer between 1-5
   - One rating per user per event
   - Allow rating updates

3. **Verification Logic**
   ```javascript
   // Pseudo-code for verification
   async function verifyTicketHolder(userId, eventId) {
     // Check if user has minted ticket for this event
     const ticket = await db.tickets.findOne({
       userId: userId,
       eventId: eventId,
       status: 'Valid'
     });

     return ticket !== null;
   }
   ```

## Frontend State Management

### LocalStorage Keys Used (for mock data)
- `comments_${eventId}` - Stores comments for an event
- `ratings_${eventId}` - Stores ratings for an event
- `mintedTickets_${walletAddress}` - Stores user's minted tickets

### State Flow

1. **User mints ticket** → Ticket stored in localStorage with eventId
2. **User clicks "Comment on Event"** → Navigates to `/mint?eventId=${eventId}&fromTicket=true`
3. **Progress step 5 activated** → Shows comment/rating section
4. **User can comment/rate** → Only if they have minted ticket for that event

## Testing the Integration

### Test Cases

1. **View Comments (No Authentication)**
   ```bash
   curl -X GET http://localhost:8080/api/events/event_1/comments-ratings
   ```

2. **Add Comment (Authenticated)**
   ```bash
   curl -X POST http://localhost:8080/api/events/event_1/comments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "userId": "0x1234...5678",
       "userName": "Test User",
       "comment": "Great event!"
     }'
   ```

3. **Add Rating (Authenticated)**
   ```bash
   curl -X POST http://localhost:8080/api/events/event_1/ratings \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "userId": "0x1234...5678",
       "userName": "Test User",
       "rating": 5
     }'
   ```

## Error Handling

### Expected Error Responses

1. **User Not Verified**
   ```json
   {
     "success": false,
     "error": "User must have a valid ticket to comment/rate",
     "code": "NOT_VERIFIED"
   }
   ```

2. **Duplicate Rating**
   ```json
   {
     "success": false,
     "error": "User has already rated this event",
     "code": "DUPLICATE_RATING"
   }
   ```

3. **Invalid Rating Value**
   ```json
   {
     "success": false,
     "error": "Rating must be between 1 and 5",
     "code": "INVALID_RATING"
   }
   ```

## Security Considerations

1. **Input Sanitization**
   - Sanitize all user inputs to prevent XSS attacks
   - Validate comment length and content
   - Validate rating values

2. **Rate Limiting**
   - Implement rate limiting on comment/rating endpoints
   - Prevent spam and abuse

3. **Authentication**
   - Use JWT or similar for user authentication
   - Verify wallet ownership through signature verification

4. **Data Privacy**
   - Don't expose full wallet addresses in public APIs
   - Truncate addresses (e.g., "0x1234...5678")

## Migration from Mock to Real API

### Step-by-Step Migration

1. **Set up backend endpoints** following the API specifications above
2. **Update environment variables** with API base URL
3. **Replace mock calls** in `CommentRatingSection.jsx`:
   - Update `fetchCommentsAndRatings()`
   - Update `handleSubmitComment()`
   - Update `handleSubmitRating()`
4. **Add authentication headers** to all API calls
5. **Test thoroughly** with real data
6. **Remove localStorage fallbacks** once backend is stable

### Environment Configuration

Create a `.env` file:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCK_DATA=false
```

Update API calls to use environment variables:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/comments-ratings`);
```

## Additional Features to Consider

1. **Comment Moderation**
   - Admin panel to review/approve comments
   - Flag inappropriate content

2. **Reply to Comments**
   - Allow organizers to respond to comments
   - Nested comment threads

3. **Edit/Delete Comments**
   - Allow users to edit their own comments
   - Soft delete with audit trail

4. **Sorting and Filtering**
   - Sort by date, rating, verified status
   - Filter by rating level

5. **Pagination**
   - Implement pagination for large comment lists
   - Load more functionality

## Support

For questions or issues with the integration, please refer to:
- Main backend integration guide: `BACKEND_INTEGRATION_GUIDE.md`
- Component documentation in source files
- API documentation (when available)

