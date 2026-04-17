# Event Scheduler Architecture

## Component Hierarchy

```
App.jsx
├── Router
    └── /admin-dashboard
        └── AdminDashboard.jsx
            ├── Tab Navigation
            │   ├── Event Scheduler Tab
            │   └── Messages Tab
            ├── [Active: Events]
            │   └── EventScheduler.jsx
            │       ├── Calendar Header
            │       ├── Event Form
            │       ├── Calendar Grid
            │       │   ├── Month Navigation
            │       │   ├── Day Cells
            │       │   └── Event Badges
            │       └── Event Details View
            │
            └── [Active: Messages]
                ├── Message List
                └── Message Details
```

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                  EventScheduler.jsx                 │
└─────────────────────────────────────────────────────┘
                        │
                        ├─ useState(events)
                        ├─ useState(selectedDate)
                        ├─ useState(showForm)
                        └─ useState(formData)

                        ▼

            ┌───────────────────────────┐
            │  Backend API Calls        │
            ├───────────────────────────┤
            │ GET /api/messages/        │
            │     activities            │
            │                           │
            │ POST /api/messages/send   │
            └───────────────────────────┘
                        │
                        ▼

            ┌───────────────────────────┐
            │   MongoDB Database        │
            ├───────────────────────────┤
            │ • Event Title             │
            │ • Description             │
            │ • Start Date              │
            │ • End Date                │
            │ • Status                  │
            │ • Creator Info            │
            └───────────────────────────┘
```

## User Interaction Flow

```
Admin User
    │
    ├─ Logs in
    │
    ▼
Routes to /admin-dashboard
    │
    ▼
AdminDashboard loads
    │
    ├─ Shows tabs: [Event Scheduler] [Messages]
    │
    ▼
User clicks "Event Scheduler" tab
    │
    ▼
EventScheduler renders
    │
    ├─ Fetches existing events (GET /api/messages/activities)
    │
    ▼
Calendar displays with events
    │
    ├─ User can:
    │   ├─ View events by clicking dates
    │   ├─ Navigate months
    │   ├─ Create new event
    │   └─ See event details
    │
    ▼
If user clicks "Schedule Event":
    │
    ├─ Form opens
    ├─ User fills in details
    ├─ User clicks "Create Event"
    │
    ▼
API Call (POST /api/messages/send)
    │
    ▼
Event saved to database
    │
    ▼
Calendar refreshes automatically
    │
    ▼
New event appears on calendar
```

## File Structure

```
frontend/
├── src/
│   ├── App.jsx ............................ Router configuration
│   │   └── Fixed imports & routes
│   │
│   ├── pages/
│   │   └── admin/
│   │       └── AdminDashboard.jsx ........ Main admin container
│   │           └── Added: Tab navigation
│   │           └── Added: EventScheduler import
│   │
│   └── components/
│       └── EventScheduler.jsx ............ NEW - Calendar component
│           ├── Calendar rendering
│           ├── Event form
│           ├── Date selection logic
│           └── API integration
```

## State Management

```
EventScheduler Component State:

┌────────────────────────────────────────┐
│ State Variables                        │
├────────────────────────────────────────┤
│ currentDate        → Current month     │
│ events             → All events array  │
│ selectedDate       → Clicked date     │
│ showForm           → Form visibility   │
│ formData           → New event input   │
│   ├─ subject       → Event title      │
│   ├─ body          → Description      │
│   ├─ startDate     → Start time       │
│   └─ endDate       → End time         │
└────────────────────────────────────────┘
```

## API Integration Points

```
Frontend (EventScheduler.jsx)
    │
    ├─ fetchEvents()
    │  └─ GET /api/messages/activities
    │     └─ Returns: {activities: []}
    │
    └─ handleCreateEvent()
       └─ POST /api/messages/send
          ├─ Body: {subject, body, startDate, endDate, recipient}
          └─ Returns: Created event

Backend (Already Exists)
    │
    ├─ routes/MessageRoute.js
    │  ├─ GET /activities → MessageController.getActivities()
    │  └─ POST /send → MessageController.sendMessage()
    │
    └─ models/MessageModel.js
       └─ Schema with startDate, endDate fields
```

## Component Dependencies

```
EventScheduler.jsx requires:
├─ React hooks
│  ├─ useState
│  ├─ useEffect
│  └─ (no custom hooks)
│
├─ External libraries
│  ├─ axios (for API calls)
│  ├─ lucide-react (for icons)
│  │  ├─ ChevronLeft
│  │  ├─ ChevronRight
│  │  ├─ X
│  │  └─ Plus
│  │
│  └─ Tailwind CSS (for styling)
│
└─ Browser APIs
   └─ localStorage (for auth token)
```

## Styling Approach

```
Tailwind CSS Utilities Used:

Colors:
├─ bg-blue-* (Primary actions)
├─ bg-green-* (Success actions)
├─ bg-gray-* (Neutral backgrounds)
├─ text-blue-* (Primary text)
└─ text-red-* (Event badges)

Layout:
├─ flex & grid (Layout)
├─ w-1/3, w-2/3 (Sizing)
├─ gap-* (Spacing)
├─ p-* (Padding)
└─ max-h-[80vh] (Height constraints)

Effects:
├─ rounded-lg (Border radius)
├─ shadow-lg (Shadows)
├─ border-* (Borders)
├─ hover:* (Hover states)
└─ transition-all (Smooth transitions)
```

---

This architecture ensures:
✅ Clean component separation
✅ Easy to maintain and extend
✅ Proper data flow
✅ Responsive UI
✅ Good performance
✅ Scalable design
