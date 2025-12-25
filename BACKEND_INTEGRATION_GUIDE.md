# Backend Integration Guide

This guide provides the API endpoints and data structures needed to integrate the Profile and Event Dashboard features with the backend.

## Overview

The frontend currently uses dummy data for demonstration. This guide outlines the API endpoints and data structures that need to be implemented on the backend to make these features fully functional.

## Authentication

All API requests should include the user's wallet address for authentication. The wallet address is obtained from the connected MetaMask wallet.

**Headers:**
```
Authorization: Bearer <wallet_address>
```

---

## Profile Page APIs

### 1. Get User Profile Data

**Endpoint:** `GET /api/user/profile`

**Description:** Retrieves all user profile information including achievements, tickets, POAPs, and events.

**Request Headers:**
```json
{
  "Authorization": "Bearer 0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1234567890abcdef...",
    "achievements": [
      {
        "id": 1,
        "title": "Early Adopter",
        "description": "Joined EventVerse in 2024",
        "icon": "star",
        "color": "purple",
        "earnedAt": "2024-12-01T10:00:00Z"
      }
    ],
    "tickets": [
      {
        "id": 1,
        "eventId": 123,
        "eventName": "Blockchain Summit 2025",
        "date": "2025-03-15",
        "status": "Active",
        "type": "VIP",
        "ticketNumber": "TKT-001-VIP"
      }
    ],
    "poaps": [
      {
        "id": 1,
        "name": "EventVerse Pioneer",
        "event": "Launch Event",
        "date": "2024-12-01",
        "tokenId": "POAP-001",
        "imageUrl": "https://..."
      }
    ],
    "events": [
      {
        "id": 1,
        "name": "Tech Conference 2025",
        "date": "2025-06-10",
        "attendees": 150,
        "status": "Upcoming",
        "venue": "Convention Center"
      }
    ]
  }
}
```

---

## Event Dashboard APIs

### 2. Get Event Dashboard Data

**Endpoint:** `GET /api/events/:eventId/dashboard`

**Description:** Retrieves comprehensive event data for the dashboard.

**Request Headers:**
```json
{
  "Authorization": "Bearer 0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tech Conference 2025",
    "date": "2025-06-10",
    "venue": "Convention Center, Downtown",
    "description": "A premier technology conference...",
    "totalTickets": 200,
    "soldTickets": 150,
    "revenue": "45.5",
    "status": "Upcoming",
    "createdBy": "0x1234567890abcdef...",
    "analytics": {
      "ticketsSold": 150,
      "checkedInCount": 45,
      "ticketDistribution": {
        "Regular": 80,
        "VIP": 50,
        "VVIP": 20
      }
    }
  }
}
```

### 3. Get Event Guests

**Endpoint:** `GET /api/events/:eventId/guests`

**Description:** Retrieves all guests who purchased tickets for the event.

**Query Parameters:**
- `checkedIn` (optional): `true` or `false` to filter by check-in status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "wallet": "0x1234...5678",
      "ticketType": "VIP",
      "checkedIn": false,
      "ticketNumber": "TKT-001-VIP",
      "purchaseDate": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### 4. Check In Guest

**Endpoint:** `POST /api/events/:eventId/checkin`

**Description:** Marks a guest as checked in for the event.

**Request Body:**
```json
{
  "guestId": 1,
  "ticketNumber": "TKT-001-VIP"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guest checked in successfully",
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "checkedIn": true,
    "checkedInAt": "2025-06-10T09:30:00Z"
  }
}
```

### 5. Remove Check-In (Check Out)

**Endpoint:** `POST /api/events/:eventId/checkout`

**Description:** Removes check-in status from a guest.

**Request Body:**
```json
{
  "guestId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guest checked out successfully"
}
```

### 6. Get Event Comments

**Endpoint:** `GET /api/events/:eventId/comments`

**Description:** Retrieves all comments for an event.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": "0x1234...5678",
      "userName": "Alice Johnson",
      "comment": "Looking forward to this event!",
      "createdAt": "2025-06-08T14:30:00Z",
      "time": "2 hours ago"
    }
  ]
}
```

### 7. Add Event Comment

**Endpoint:** `POST /api/events/:eventId/comments`

**Description:** Adds a new comment to an event.

**Request Body:**
```json
{
  "comment": "Will there be parking available?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": 2,
    "userId": "0x1234...5678",
    "userName": "Bob Smith",
    "comment": "Will there be parking available?",
    "createdAt": "2025-06-08T16:45:00Z"
  }
}
```

---

## POAP Integration

### 8. Award POAP to Checked-In Guest

**Endpoint:** `POST /api/events/:eventId/poap/award`

**Description:** Awards a POAP (Proof of Attendance Protocol) NFT to a checked-in guest.

**Request Body:**
```json
{
  "guestId": 1,
  "guestWallet": "0x1234...5678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "POAP awarded successfully",
  "data": {
    "poapId": "POAP-001",
    "tokenId": "12345",
    "transactionHash": "0xabcdef...",
    "imageUrl": "https://..."
  }
}
```

---

## Data Models

### User Profile Model
```typescript
interface UserProfile {
  walletAddress: string;
  achievements: Achievement[];
  tickets: Ticket[];
  poaps: POAP[];
  events: Event[];
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

interface Ticket {
  id: number;
  eventId: number;
  eventName: string;
  date: string;
  status: 'Active' | 'Used' | 'Expired';
  type: 'Regular' | 'VIP' | 'VVIP';
  ticketNumber: string;
}

interface POAP {
  id: number;
  name: string;
  event: string;
  date: string;
  tokenId: string;
  imageUrl?: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  attendees: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  venue: string;
}
```

### Event Dashboard Model
```typescript
interface EventDashboard {
  id: number;
  name: string;
  date: string;
  venue: string;
  description: string;
  totalTickets: number;
  soldTickets: number;
  revenue: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  createdBy: string;
  analytics: EventAnalytics;
}

interface EventAnalytics {
  ticketsSold: number;
  checkedInCount: number;
  ticketDistribution: {
    Regular: number;
    VIP: number;
    VVIP: number;
  };
}

interface Guest {
  id: number;
  name: string;
  wallet: string;
  ticketType: 'Regular' | 'VIP' | 'VVIP';
  checkedIn: boolean;
  ticketNumber: string;
  purchaseDate: string;
  checkedInAt?: string;
}

interface Comment {
  id: number;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  time: string;
}
```

---

## Frontend Integration Points

### Profile Page (`src/pages/Profile.jsx`)

**Lines to Update:**
- Line 50-75: Replace dummy `userData` with API call to `/api/user/profile`

**Example Integration:**
```javascript
useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${walletAddress}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setUserData(result.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  if (walletAddress) {
    fetchUserProfile();
  }
}, [walletAddress]);
```

### Event Dashboard (`src/pages/EventDashboard.jsx`)

**Lines to Update:**
- Line 40-48: Replace dummy `eventData` with API call to `/api/events/:eventId/dashboard`
- Line 51-57: Replace dummy `allGuests` with API call to `/api/events/:eventId/guests`
- Line 59-62: Replace dummy `comments` with API call to `/api/events/:eventId/comments`
- Line 67-73: Update `handleCheckIn` to call `/api/events/:eventId/checkin`
- Line 75-81: Update `handleCheckOut` to call `/api/events/:eventId/checkout`

**Example Integration:**
```javascript
useEffect(() => {
  const fetchEventData = async () => {
    try {
      const [dashboardRes, guestsRes, commentsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/events/${eventId}/dashboard`, {
          headers: { 'Authorization': `Bearer ${walletAddress}` }
        }),
        fetch(`http://localhost:8080/api/events/${eventId}/guests`, {
          headers: { 'Authorization': `Bearer ${walletAddress}` }
        }),
        fetch(`http://localhost:8080/api/events/${eventId}/comments`, {
          headers: { 'Authorization': `Bearer ${walletAddress}` }
        })
      ]);

      const dashboard = await dashboardRes.json();
      const guests = await guestsRes.json();
      const comments = await commentsRes.json();

      if (dashboard.success) setEventData(dashboard.data);
      if (guests.success) setAllGuests(guests.data);
      if (comments.success) setComments(comments.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  };

  if (eventId && walletAddress) {
    fetchEventData();
  }
}, [eventId, walletAddress]);

const handleCheckIn = async (guestId) => {
  try {
    const guest = allGuests.find(g => g.id === guestId);
    const response = await fetch(`http://localhost:8080/api/events/${eventId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${walletAddress}`
      },
      body: JSON.stringify({
        guestId,
        ticketNumber: guest.ticketNumber
      })
    });

    const result = await response.json();
    if (result.success) {
      setAllGuests(prevGuests =>
        prevGuests.map(g =>
          g.id === guestId ? { ...g, checkedIn: true } : g
        )
      );
    }
  } catch (error) {
    console.error('Error checking in guest:', error);
  }
};
```

---

## Error Handling

All API responses should follow this error format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `SERVER_ERROR`: Internal server error

---

## Security Considerations

1. **Wallet Verification**: Verify that the wallet address in the Authorization header matches the signed message
2. **Event Ownership**: Verify that the user owns the event before allowing dashboard access
3. **Rate Limiting**: Implement rate limiting on all endpoints
4. **Input Validation**: Validate all input data to prevent injection attacks
5. **CORS**: Configure CORS to only allow requests from your frontend domain

---

## Testing

Use tools like Postman or curl to test the API endpoints:

```bash
# Example: Get user profile
curl -X GET http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer 0x1234567890abcdef..."

# Example: Check in guest
curl -X POST http://localhost:8080/api/events/1/checkin \
  -H "Authorization: Bearer 0x1234567890abcdef..." \
  -H "Content-Type: application/json" \
  -d '{"guestId": 1, "ticketNumber": "TKT-001-VIP"}'
```

---

## Next Steps

1. Implement the API endpoints on the backend
2. Update the frontend components to use real API calls instead of dummy data
3. Test the integration thoroughly
4. Implement POAP minting functionality for checked-in guests
5. Add real-time updates using WebSockets (optional)

For questions or issues, please contact the development team.


