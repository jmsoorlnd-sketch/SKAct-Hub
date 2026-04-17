# SK Personnel Management Feature

## Overview

Added a comprehensive SK Personnel Management system that allows officials to manage SK officials (Chairman, Vice President, Secretary) and a list of SK Kagawad members.

## Features

### 1. SK Officials Management

- **SK Chairman**: Edit name, age, and status (Active/Inactive)
- **SK Vice President**: Edit name, age, and status (Active/Inactive)
- **SK Secretary**: Edit name, age, and status (Active/Inactive)

### 2. SK Kagawad Management

- **Add Kagawad**: Add new members with name, age, and status
- **Edit Kagawad**: Update existing kagawad information
- **Delete Kagawad**: Remove kagawad from the list
- **List View**: Display all kagawad in a table format with status indicators

## Database Schema

### SKPersonnel Model

Located at: `backend/models/SKPersonnelModel.js`

```javascript
{
  barangay: ObjectId (ref to Barangay),
  chairman: { name, age, status },
  vicePresident: { name, age, status },
  secretary: { name, age, status },
  kagawad: [ { _id, name, age, status } ],
  createdAt: Date,
  updatedAt: Date
}
```

## Backend Implementation

### Controller: `SKPersonnelController.js`

Endpoints:

- `GET /:barangayId` - Fetch SK Personnel data
- `PUT /:barangayId/chairman` - Update chairman
- `PUT /:barangayId/vice-president` - Update vice president
- `PUT /:barangayId/secretary` - Update secretary
- `POST /:barangayId/kagawad` - Add kagawad
- `PUT /:barangayId/kagawad/:kagawadId` - Update kagawad
- `DELETE /:barangayId/kagawad/:kagawadId` - Delete kagawad

### Route: `SKPersonnelRoute.js`

All routes are protected with `requireAuth` middleware.

## Frontend Implementation

### Page: `SKPersonnelPage.jsx`

Located at: `frontend/src/pages/officials/SKPersonnelPage.jsx`

**Features:**

- Display SK officials in card format with color-coded borders
- Edit form for each official position (Chairman, VP, Secretary)
- Table view of all kagawad members
- Add kagawad form with modal
- Edit kagawad inline modal
- Delete kagawad with confirmation
- Toast notifications for user feedback

### UI Components

- Three cards for SK Officials (Chairman, VP, Secretary)
- Interactive table for Kagawad list
- Modal forms for editing
- Status indicators (Active/Inactive with color coding)

## Navigation

### Sidebar Integration

Added "SK Personnel" link to the Official Panel sidebar:

- Route: `/sk-personnel`
- Icon: Users
- Role: Official only

### App Routes

Added route protection to ensure only Officials can access:

```javascript
<Route
  path="/sk-personnel"
  element={
    <RoleProtectedRoute role={["Official"]}>
      <SKPersonnelPage />
    </RoleProtectedRoute>
  }
/>
```

## API Integration

### Base URL

`/api/sk-personnel`

### Example Requests

**Fetch SK Personnel:**

```bash
GET /api/sk-personnel/:barangayId
```

**Update Chairman:**

```bash
PUT /api/sk-personnel/:barangayId/chairman
Body: { name, age, status }
```

**Add Kagawad:**

```bash
POST /api/sk-personnel/:barangayId/kagawad
Body: { name, age, status }
```

**Update Kagawad:**

```bash
PUT /api/sk-personnel/:barangayId/kagawad/:kagawadId
Body: { name, age, status }
```

**Delete Kagawad:**

```bash
DELETE /api/sk-personnel/:barangayId/kagawad/:kagawadId
```

## How to Use

1. **Login as Official** - Officials can access the feature from the sidebar
2. **Navigate to SK Personnel** - Click the "SK Personnel" link in the sidebar
3. **Manage Officials:**
   - Click "Edit" on any official card
   - Fill in name, age, and status
   - Click "Save"
4. **Manage Kagawad:**
   - Click "Add Kagawad" button
   - Fill in the form and click "Add"
   - Click edit icon to modify or trash icon to delete

## Files Created/Modified

### Created:

- `backend/models/SKPersonnelModel.js` - Database model
- `backend/controllers/SKPersonnelController.js` - API logic
- `backend/routes/SKPersonnelRoute.js` - API routes
- `frontend/src/pages/officials/SKPersonnelPage.jsx` - UI Page

### Modified:

- `backend/server.js` - Added SKPersonnel route import
- `frontend/src/App.jsx` - Added route and import
- `frontend/src/components/navbars/Sidebar.jsx` - Added navigation link

## Styling

- Uses Tailwind CSS for responsive design
- Color-coded status indicators (green for Active, red for Inactive)
- Hover effects on interactive elements
- Modal overlay for editing kagawad
- Responsive table layout
