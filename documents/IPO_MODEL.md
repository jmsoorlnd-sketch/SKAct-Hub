# IPO (Input-Process-Output) Model - SIMPLIFIED

## Barangay Administration & Event Management System

---

## Overview

IPO describes how data flows through the system:

- **INPUT**: Data entering the system
- **PROCESS**: Data transformation & validation
- **OUTPUT**: Results delivered to users

---

## 1. Event Scheduling

### 1.1 Event Creation

| Phase         | Details                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| **INPUT**     | Event title, description, start/end dates, location, creator ID              |
| **PROCESS**   | Validate input → Check auth → Add metadata (timestamp, ID) → Save to MongoDB |
| **OUTPUT**    | ✅ Event ID + Success message OR ❌ Error code + Details                     |
| **UI Update** | Calendar refreshes, badge shows count, toast notification                    |

### 1.2 Event Viewing

| Phase         | Details                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| **INPUT**     | Date selected, user ID, barangay ID, optional filters                      |
| **PROCESS**   | Authenticate → Query MongoDB by date range → Format results → Count events |
| **OUTPUT**    | Event list with details OR empty list if no events                         |
| **UI Update** | Event badges show count, detailed list populates, click-through enabled    |

---

## 2. Personnel Management

### 2.1 SK Officials Update

| Phase         | Details                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| **INPUT**     | Chairman/VP/Secretary name, age, status (Active/Inactive)                  |
| **PROCESS**   | Validate data → Check authorization → Update SKPersonnelModel → Log change |
| **OUTPUT**    | ✅ Updated record with timestamp OR ❌ Authorization error                 |
| **UI Update** | Form clears, personnel list refreshes, success toast shown                 |

### 2.2 Kagawad Management (Add/Edit/Delete)

| Phase         | Details                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| **INPUT**     | Kagawad name, age, status, district (for add/edit); Kagawad ID (for delete) |
| **PROCESS**   | Validate → Check auth → Add/Update/Remove from array → Persist to DB        |
| **OUTPUT**    | ✅ Modified list OR ❌ Error message                                        |
| **UI Update** | Table refreshes, member count updates, confirmation shown                   |

---

## 3. Communication & Messaging

### 3.1 Send Message

| Phase            | Details                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| **INPUT**        | Sender ID, recipient(s), subject, body, priority level                      |
| **PROCESS**      | Validate → Create MessageModel doc → Queue notifications → Trigger delivery |
| **OUTPUT**       | ✅ Message ID + delivery status OR ❌ Delivery error                        |
| **Side Effects** | Email sent, SMS sent, in-app notification to recipients                     |

### 3.2 View Messages (Inbox)

| Phase         | Details                                                            |
| ------------- | ------------------------------------------------------------------ |
| **INPUT**     | User ID, folder (Inbox/Sent), pagination, filters                  |
| **PROCESS**   | Authenticate → Query messages → Mark as read → Format for display  |
| **OUTPUT**    | Message list, unread count, sender/recipient info                  |
| **UI Update** | Inbox populated, unread badge updates, full message opens on click |

---

## 4. Authentication & Security

### 4.1 User Login

| Phase        | Details                                                           |
| ------------ | ----------------------------------------------------------------- |
| **INPUT**    | Username/Email, password, device info                             |
| **PROCESS**  | Lookup user → Verify password hash → Generate JWT → Store session |
| **OUTPUT**   | ✅ JWT token + user data OR ❌ "Invalid credentials"              |
| **Security** | Token expires in 24h, refresh token available                     |

### 4.2 Authorization Check

| Phase          | Details                                                       |
| -------------- | ------------------------------------------------------------- |
| **INPUT**      | JWT token, requested action, required role                    |
| **PROCESS**    | Verify token validity → Extract user role → Check permissions |
| **OUTPUT**     | ✅ Allow access OR ❌ 403 Forbidden                           |
| **Protection** | Role-based access control (Admin, Official, Youth)            |

---

## 5. Notifications

### 5.1 Multi-Channel Delivery

| Phase         | Details                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| **INPUT**     | Trigger event (event created, message received, personnel updated, etc.)                   |
| **PROCESS**   | Determine recipients → Create notification → Queue for delivery (in-app, email, SMS, push) |
| **OUTPUT**    | Notification record stored + delivered via all enabled channels                            |
| **UI Update** | Toast shows, unread badge increments, notification dropdown updates                        |

---

## 6. Admin & Reporting

### 6.1 Dashboard Analytics

| Phase         | Details                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| **INPUT**     | Admin user ID, time range filter (today/week/month/year)                             |
| **PROCESS**   | Query all collections → Aggregate counts → Calculate statistics → Format for display |
| **OUTPUT**    | Dashboard metrics (total events, active personnel, message volume, system health)    |
| **UI Update** | Cards refresh, charts update, activity log displayed                                 |

---

## Quick Reference: IPO Summary Table

| Feature              | INPUT           | PROCESS                          | OUTPUT                     |
| -------------------- | --------------- | -------------------------------- | -------------------------- |
| **Create Event**     | Event form data | Validate → Auth → Save           | Event ID + Success         |
| **View Events**      | Date selection  | Query → Format                   | Event list with badges     |
| **Update Personnel** | Official info   | Validate → Update                | Updated record             |
| **Send Message**     | Compose form    | Create → Queue → Deliver         | Message ID + Notifications |
| **View Inbox**       | Filter criteria | Query → Mark read                | Message list               |
| **Login**            | Credentials     | Lookup → Verify → Generate token | JWT token                  |
| **Check Access**     | Token + action  | Verify → Check role              | Allow/Deny                 |
| **Notifications**    | Trigger event   | Determine recipients → Queue     | Multi-channel alerts       |
| **Analytics**        | Time range      | Aggregate → Calculate            | Dashboard data             |

---

## Data Flow Overview

```
USER INPUT
    ↓
FRONTEND VALIDATION (Check format, required fields)
    ↓
API REQUEST (POST/GET/PUT to backend)
    ↓
BACKEND VALIDATION (Re-validate, check auth)
    ↓
BUSINESS LOGIC (Process request with rules)
    ↓
DATABASE OPERATION (Query/Insert/Update/Delete)
    ↓
RESPONSE FORMATTING (JSON response)
    ↓
FRONTEND DISPLAY (Update UI, show results)
    ↓
SIDE EFFECTS (Optional: send emails, SMS, notifications)
```

---

## Key Processing Rules

### Authentication Flow

- All requests require valid JWT token
- Token contains user ID and role
- Invalid/expired token → 401 Unauthorized
- Missing token → redirect to login

### Authorization Flow

- After authentication, check user role
- Admin role → full system access
- Official role → barangay-level access
- Youth/User role → limited actions
- Insufficient permissions → 403 Forbidden

### Data Validation

- Frontend validates format and required fields (UX feedback)
- Backend re-validates all inputs (security)
- Sanitize text inputs to prevent XSS
- Encode special characters
- Reject oversized payloads

### Error Handling

- Validation errors → descriptive message + field hints
- Authorization errors → generic "Access Denied" (security)
- Database errors → retry on failure, log for monitoring
- Timeouts → return 504 with user-friendly message

---

## Document-Database Mapping

| IPO Process                     | MongoDB Collection    | Key Fields                                       |
| ------------------------------- | --------------------- | ------------------------------------------------ |
| Event Creation/Viewing/Updating | ProjectModel          | \_id, title, startDate, endDate, creator, status |
| Personnel Management            | SKPersonnelModel      | chairman, vicePresident, secretary, kagawad      |
| Messaging                       | MessageModel          | \_id, sender, recipients, subject, body, readBy  |
| Authentication                  | UserModel             | \_id, email, passwordHash, role, barangayId      |
| Notifications                   | NotificationModel     | \_id, userId, type, status, createdAt, priority  |
| Admin Dashboard                 | (Aggregates multiple) | (Queries all collections)                        |

---

## Summary

The IPO model documents how data flows through 6 main subsystems:

1. **Event Scheduling**: Create, view, and manage events
2. **Personnel Management**: Maintain SK Chairman, VP, Secretary, and Kagawad rosters
3. **Communication**: Send and receive messages between users
4. **Authentication**: Login and verify access permissions
5. **Notifications**: Deliver alerts via multiple channels
6. **Admin Reporting**: Aggregate metrics and generate dashboards

Each process follows a consistent flow: validate input → check authorization → execute business logic → persist changes → trigger side effects (notifications, audit logs) → return formatted response with UI updates.
│ │
│ Quick Actions: │
│ • [Schedule Event] │
│ • [Send Message] │
│ • [View All Events] │
│ • [Manage Personnel] │
│ │
│ Frontend Display: │
│ • Dashboard cards rendered │
│ • Charts/graphs displayed │
│ • Tables populated │
│ • Quick links active │
│ • Real-time updates enabled │
│ • Refresh timestamp shown │
└─────────────────────────────────────────┘

```

---

## Summary Table: IPO Matrix

| Subsystem             | Input                   | Process Type                           | Output                                     |
| --------------------- | ----------------------- | -------------------------------------- | ------------------------------------------ |
| **Event Scheduling**  | Event details form      | Validation → Processing → Storage      | Event ID, Confirmation, UI Update          |
| **Event Viewing**     | Date selection          | Auth → Query → Transform → Format      | Event list with details, Badge counts      |
| **Personnel Mgmt**    | Personnel form          | Validation → Auth → Update → Log       | Updated record, Notification               |
| **Kagawad Mgmt**      | Add/Edit/Delete form    | Validation → Auth → CRUD → Log         | Modified list, Confirmation                |
| **Messaging**         | Compose form            | Validation → Auth → Delivery → Log     | Message ID, Notifications, Delivery status |
| **Message Retrieval** | Folder/filter selection | Auth → Query → Enrich → Mark read      | Message list, Unread counts                |
| **Login**             | Credentials             | Validation → Lookup → Verify → Session | Auth token, User data, Redirect            |
| **Search**            | Query + filters         | Validation → Auth → Query → Rank       | Results list, Preview, Click-through       |
| **Notifications**     | Trigger event           | Create → Auth → Deliver → Track        | Multi-channel notifications, UI updates    |
| **Dashboard**         | Role + time range       | Auth → Aggregate → Calculate → Format  | Analytics, Cards, Charts, Summary          |

---

## Data Flow Diagram

```

USER INPUT
↓
FRONTEND VALIDATION
↓
API REQUEST → BACKEND VALIDATION
↓
AUTHORIZATION CHECK
↓
BUSINESS LOGIC PROCESSING
↓
DATABASE OPERATIONS
↓
RESPONSE FORMATTING
↓
FRONTEND RENDERING
↓
USER SEES OUTPUT
↓
OPTIONAL: SIDE EFFECTS
(Notifications, Logging, Updates)

```

---

## Document References

- **Detailed Component Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Event Scheduler Specifics**: See [EVENT_SCHEDULER_GUIDE.md](EVENT_SCHEDULER_GUIDE.md)
- **Implementation Details**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Conceptual Framework**: See [CONCEPTUAL_BACKGROUND.md](CONCEPTUAL_BACKGROUND.md)
```
