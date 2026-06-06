-- VRS physical schema (MySQL). Created idempotently on startup.
-- Mirrors the ERD: child tables hold the parent keys as FOREIGN KEYs.

CREATE TABLE IF NOT EXISTS Users (
  User_ID          INT AUTO_INCREMENT PRIMARY KEY,
  UserName         VARCHAR(50)  NOT NULL UNIQUE,
  Password         VARCHAR(255) NOT NULL,
  Role             VARCHAR(20)  NOT NULL DEFAULT 'staff',
  -- New accounts start 'pending' and need admin approval before they can log in.
  Status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  RecoveryCodeHash VARCHAR(255) NOT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Customer (
  Customer_ID INT AUTO_INCREMENT PRIMARY KEY,
  Full_Name   VARCHAR(100) NOT NULL,
  National_ID VARCHAR(20)  NOT NULL UNIQUE,
  Phone       VARCHAR(10)  NOT NULL,
  Email       VARCHAR(120) NOT NULL,
  Address     VARCHAR(150) NOT NULL,
  owner_id    INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_owner (owner_id),
  CONSTRAINT fk_customer_user FOREIGN KEY (owner_id)
    REFERENCES Users(User_ID) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Vehicle (
  Plate_Number   VARCHAR(10) PRIMARY KEY,
  Brand          VARCHAR(50) NOT NULL,
  Model          VARCHAR(50) NOT NULL,
  Year           INT NOT NULL,
  Vehicle_Type   VARCHAR(30) NOT NULL,
  Purchase_Price DECIMAL(12,2) NOT NULL,
  Status         VARCHAR(20) NOT NULL DEFAULT 'Available',
  owner_id       INT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle_owner (owner_id),
  CONSTRAINT fk_vehicle_user FOREIGN KEY (owner_id)
    REFERENCES Users(User_ID) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Reservation_Rental (
  Reservation_ID     INT AUTO_INCREMENT PRIMARY KEY,
  Customer_ID        INT NOT NULL,
  Plate_Number       VARCHAR(10) NOT NULL,
  Recorded_By        INT NOT NULL,
  Reservation_Date   DATE NOT NULL,
  Start_Date         DATE NOT NULL,
  End_Date           DATE NOT NULL,
  Reservation_Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  Rental_Date        DATE NULL,
  Return_Date        DATE NULL,
  Rental_Fee         DECIMAL(12,2) NOT NULL DEFAULT 0,
  Rental_Status      VARCHAR(20) NOT NULL DEFAULT 'Not Started',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rr_owner (Recorded_By),
  INDEX idx_rr_customer (Customer_ID),
  INDEX idx_rr_vehicle (Plate_Number),
  CONSTRAINT fk_rr_customer FOREIGN KEY (Customer_ID)
    REFERENCES Customer(Customer_ID) ON DELETE RESTRICT,
  CONSTRAINT fk_rr_vehicle FOREIGN KEY (Plate_Number)
    REFERENCES Vehicle(Plate_Number) ON DELETE RESTRICT,
  CONSTRAINT fk_rr_user FOREIGN KEY (Recorded_By)
    REFERENCES Users(User_ID) ON DELETE RESTRICT
) ENGINE=InnoDB;
