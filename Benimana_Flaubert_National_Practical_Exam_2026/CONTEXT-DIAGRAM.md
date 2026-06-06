# VRS — Level 0 DFD (Context Diagram)

One central process (the VRS) with its external entities and the labelled data flows in and out.

```mermaid
flowchart TB
    CUST(["Customer"])
    EMP(["Employee / User"])
    ADMIN(["Administrator"])

    SYS((("Vehicle Rental & Reservation Subsystem (VRS)")))

    %% Customer flows
    CUST -- "Reservation / rental request, personal details" --> SYS
    SYS -- "Booking confirmation, rental fee, vehicle availability" --> CUST

    %% Employee/User flows
    EMP -- "Login, customer/vehicle/reservation records, searches" --> SYS
    SYS -- "Real-time vehicle status, reservation list, reports" --> EMP

    %% Administrator flows
    ADMIN -- "User accounts, configuration" --> SYS
    SYS -- "Reservation-rental report, system status" --> ADMIN
```

**Reading it:** Customers submit reservation/rental requests and their details and receive confirmations and fees. Employees (Users) log in to create/read/update/delete and search Customer, Vehicle and Reservation records, and receive real-time status and reports. The Administrator manages user accounts and receives the consolidated Customer–Vehicle Reservation-Rental report.
