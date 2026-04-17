# User Role Flowcharts

## Admin Flowchart

```mermaid
graph TD
    Start([Admin Login]) --> A[Dashboard]

    A --> B{Admin Options}

    B -->|Manage Officials| C[View All Officials]
    C --> C1{Action}
    C1 -->|Create| C2[Add New Official]
    C1 -->|View| C3[Get Official Details]
    C1 -->|Edit| C4[Update Official Info]
    C1 -->|Change Status| C5[Active/Inactive]
    C1 -->|Delete| C6[Remove Official]

    B -->|Schedule Events| D[Event Scheduler]
    D --> D1[Create Event]
    D1 --> D2[Set Date & Time]
    D2 --> D3[Save to Database]

    B -->|Monitor Activities| E[View Logs & Reports]
    E --> E1[User Activity Logs]
    E1 --> E2[System Reports]

    B -->|User Management| F[Manage Users]
    F --> F1{User Actions}
    F1 -->|View Deleted| F2[Restore Users]
    F1 -->|Permanently Delete| F3[Remove from System]

    C2 --> End([Back to Dashboard])
    C3 --> End
    C4 --> End
    C5 --> End
    C6 --> End
    D3 --> End
    E2 --> End
    F2 --> End
    F3 --> End
```

---

## Official/SK Personnel Flowchart

```mermaid
graph TD
    Start([Official Login]) --> A[Official Dashboard]

    A --> B{Personnel Management}

    B -->|Chairman| C[View/Edit Chairman]
    C --> C1[Update Name & Details]
    C --> C2[Set Status]
    C1 --> End([Back to Dashboard])
    C2 --> End

    B -->|Secretary| D[View/Edit Secretary]
    D --> D1[Update Name & Details]
    D --> D2[Set Status]
    D1 --> End
    D2 --> End

    B -->|Treasurer| E[View/Edit Treasurer]
    E --> E1[Update Name & Details]
    E --> E2[Set Status]
    E1 --> End
    E2 --> End

    B -->|Kagawad Members| F{Kagawad Actions}
    F -->|Add| F1[Create New Kagawad]
    F1 --> F2[Enter Details]
    F2 --> End
    F -->|Edit| F3[Update Kagawad Info]
    F3 --> End
    F -->|Remove| F4[Delete Kagawad]
    F4 --> End
```

---

## Quick Reference Table

| Role         | Main Actions        | Key Features                          |
| ------------ | ------------------- | ------------------------------------- |
| **Admin**    | Manage Officials    | Create, Edit, Delete, Restore users   |
| **Admin**    | Schedule Events     | Create events with dates & times      |
| **Admin**    | Monitor System      | View activity logs & reports          |
| **Official** | Manage SK Positions | Update Chairman, Secretary, Treasurer |
| **Official** | Manage Kagawad      | Add, Edit, Remove Kagawad members     |
