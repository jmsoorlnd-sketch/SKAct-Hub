# Quick Start Guide - Event Scheduler

## 🎯 What You Got

A fully functional **event scheduling calendar** for your admin dashboard that looks like the calendar interface in your reference image.

## 🚀 Getting Started (3 Steps)

### Step 1: Start Your Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Login as Admin

- Go to http://localhost:5173
- Login with an Admin account
- You'll be redirected to the dashboard

### Step 3: Access Event Scheduler

- Click on `/admin-dashboard` in your navigation
- Click the **"Event Scheduler"** tab at the top
- Start scheduling events!

## 📅 Using the Calendar

### Create an Event

```
1. Click "Schedule Event" button (+ icon)
2. Fill in:
   - Event Title (required)
   - Description
   - Start Date & Time (required)
   - End Date & Time
3. Click "Create Event"
```

### View Events

```
1. Click any date on the calendar
2. Events for that date appear below
3. See: Title, Description, Time, Status
```

### Navigate Calendar

```
- Use < > buttons to go prev/next month
- Use year dropdown to jump to different year
- Click "Today" to go to current date
```

## 📁 What Changed

### New File

- `frontend/src/components/EventScheduler.jsx` (350 lines)
  - Full calendar logic
  - Event creation form
  - Event display UI

### Updated Files

- `frontend/src/pages/admin/AdminDashboard.jsx`

  - Added EventScheduler import
  - Added tab navigation
  - Organized Events/Messages sections

- `frontend/src/App.jsx`
  - Fixed import statements
  - Added AdminDashboard route
  - Fixed syntax errors

## 🎨 Features You Can See

✅ Professional calendar layout
✅ Month/year navigation  
✅ Today highlighting
✅ Event count badges
✅ Create events inline
✅ View event details
✅ Tab-based layout
✅ Mobile responsive
✅ Clean UI with Tailwind CSS

## 🔌 API Endpoints Used

```
GET  /api/messages/activities      - Fetch all events
POST /api/messages/send            - Create new event
```

Both endpoints already exist in your backend - no changes needed!

## ⚠️ Troubleshooting

| Problem             | Solution                               |
| ------------------- | -------------------------------------- |
| Events not showing  | Check backend is running on port 5000  |
| Can't create event  | Ensure Title and Start Date are filled |
| Tab doesn't switch  | Clear browser cache and refresh        |
| Styling looks wrong | Make sure Tailwind CSS is loaded       |

## 📞 Need Help?

Check these files for more info:

- `EVENT_SCHEDULER_GUIDE.md` - Detailed guide
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `frontend/src/components/EventScheduler.jsx` - Source code

## ✨ Next Steps

You can enhance this further with:

- Edit/Delete events
- Recurring events
- Event categories
- Email notifications
- Search/filter events

---

**Everything is ready to go! Start your app and navigate to the admin dashboard to see your new event scheduler in action.** 🎉
