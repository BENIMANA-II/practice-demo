# VRS — Entity Relationship Diagram

Database: **VRS** (MySQL)

- **PK** = Primary Key, **FK** = Foreign Key.
- A Customer makes many reservations/rentals; each reservation belongs to one customer.
- A Vehicle is reserved/rented many times; each reservation involves one vehicle.
- A User records many reservations/rentals; each reservation is recorded by one user.

```mermaid
erDiagram
    CUSTOMER ||--o{ RESERVATION_RENTAL : "makes"
    VEHICLE  ||--o{ RESERVATION_RENTAL : "is reserved/rented in"
    USERS    ||--o{ RESERVATION_RENTAL : "records"
    USERS    ||--o{ CUSTOMER : "owns"
    USERS    ||--o{ VEHICLE : "owns"

    CUSTOMER {
        int     Customer_ID  PK "AUTO_INCREMENT"
        varchar Full_Name
        varchar National_ID  "UNIQUE"
        varchar Phone
        varchar Email
        varchar Address
        int     owner_id     FK "-> USERS.User_ID"
    }

    VEHICLE {
        varchar Plate_Number   PK
        varchar Brand
        varchar Model
        int     Year
        varchar Vehicle_Type
        decimal Purchase_Price
        varchar Status
        int     owner_id       FK "-> USERS.User_ID"
    }

    RESERVATION_RENTAL {
        int     Reservation_ID     PK "AUTO_INCREMENT"
        int     Customer_ID        FK "-> CUSTOMER.Customer_ID"
        varchar Plate_Number       FK "-> VEHICLE.Plate_Number"
        int     Recorded_By        FK "-> USERS.User_ID"
        date    Reservation_Date
        date    Start_Date
        date    End_Date
        varchar Reservation_Status
        date    Rental_Date
        date    Return_Date
        decimal Rental_Fee
        varchar Rental_Status
    }

    USERS {
        int     User_ID          PK "AUTO_INCREMENT"
        varchar UserName         "UNIQUE"
        varchar Password         "bcrypt hash"
        varchar Role
        varchar RecoveryCodeHash "bcrypt hash"
    }
```

## Keys summary

| Table | Primary Key | Foreign Keys |
|-------|-------------|--------------|
| Customer | Customer_ID | owner_id → Users(User_ID) |
| Vehicle | Plate_Number | owner_id → Users(User_ID) |
| Reservation_Rental | Reservation_ID | Customer_ID → Customer, Plate_Number → Vehicle, Recorded_By → Users |
| Users | User_ID | — |
