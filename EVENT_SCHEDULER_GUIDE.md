# Event Scheduler for Admin Dashboard

## Overview

A new **Event Scheduler** calendar component has been added to the Admin Dashboard, allowing administrators to schedule, view, and manage events with a professional calendar interface.

## Features

### 📅 Calendar View

- **Month-based calendar** with day-by-day navigation
- **Today indicator** to highlight current date
- **Event counter** on each day showing number of scheduled events
- **Year selector** for quick navigation between years
- **Previous/Next month navigation** buttons

### 📝 Event Creation

- **Schedule new events** with title, description, and date/time
- **Start and End date/time** support for multi-hour events
- **Event form** with validation for required fields
- **Inline creation** within the scheduler interface

### 📊 Event Display

- **Selected date view** showing all events for that day
- **Event details** including title, description, time, and status
- **Color-coded events** with status indicators
- **Easy event browsing** by clicking on calendar dates

### 🗂️ Tab Navigation

The Admin Dashboard now features two main sections:

1. **Event Scheduler Tab** - Calendar and event management
2. **Messages Tab** - Inbox and message management

## How to Use

### Accessing the Event Scheduler

1. Log in as an **Admin** user
2. Navigate to `/admin-dashboard`
3. Click the **"Event Scheduler"** tab

### Creating an Event

1. Click the **"Schedule Event"** button (blue + icon)
2. Fill in the event details:
   - **Event Title** (required) - e.g., "Community Meeting"
   - **Description** - Event details and agenda
   - **Start Date & Time** (required) - When the event begins
   - **End Date & Time** - When the event ends
3. Click **"Create Event"** to save
4. The event will appear on the calendar

### Viewing Events

1. Click on any date in the calendar
2. Events scheduled for that date will appear below
3. View event details including:
   - Event title
   - Description
   - Start and end times
   - Current status

### Navigation

- Use the **month arrows** (< >) to move between months
- Use the **year selector** dropdown to jump to a different year
- Click **"Today"** button to return to the current date

## Component Files

### New Components Created

- **[EventScheduler.jsx](../components/EventScheduler.jsx)** - Main calendar component with event scheduling functionality

### Modified Files

- **[AdminDashboard.jsx](../pages/admin/AdminDashboard.jsx)** - Added EventScheduler and tab navigation
- **[App.jsx](../../App.jsx)** - Fixed imports and routing for AdminDashboard

## API Integration

The component integrates with the existing backend APIs:

### Fetch Events

```
GET /api/messages/activities
```

Retrieves all scheduled activities/events.

### Create Event

```
POST /api/messages/send
```

Creates a new event with:

- `subject` - Event title
- `body` - Event description
- `startDate` - Event start time
- `endDate` - Event end time
- `recipient` - "admin"

## Data Model

Events are stored with the following properties:

- `_id` - Unique event identifier
- `subject` - Event title
- `body` - Event description
- `startDate` - Start date/time
- `endDate` - End date/time
- `status` - Event status (pending, approved, ongoing, rejected, completed)
- `sender` - Event creator information
- `createdAt` - Creation timestamp

## Status Indicators

Events can have the following statuses:

- **pending** - Awaiting approval
- **approved** - Approved by admin
- **ongoing** - Currently active
- **rejected** - Not approved
- **completed** - Finished

## UI/UX Details

### Colors & Styling

- **Blue highlight** - Today's date
- **Green highlight** - Selected date
- **Red event badge** - Event count indicator
- **Blue event card** - Event details display

### Layout

- **Responsive design** with Tailwind CSS
- **Shadow effects** for depth
- **Smooth transitions** for interactions
- **Mobile-friendly** calendar view

## Features for Future Enhancement

Potential improvements could include:

- Event editing and deletion
- Recurring events support
- Event categories/tags
- Attendee management
- Email notifications
- Event search and filtering
- Drag-and-drop event scheduling

## Troubleshooting

### Events not showing?

- Ensure you're logged in as an Admin user
- Check network connection to backend API
- Verify API endpoint is running on `http://localhost:5000`

### Can't create events?

- Verify all required fields are filled (title and start date)
- Check browser console for API errors
- Ensure token is valid in localStorage

### Navigation issues?

- Clear browser cache if styling looks off
- Check that Tailwind CSS is properly loaded
- Verify component imports in AdminDashboard

## Notes

- The EventScheduler now displays events fetched from the activities API
- Events are displayed with their full details when a date is selected
- The admin can easily switch between managing events and viewing messages
- All events are synchronized with the backend database
