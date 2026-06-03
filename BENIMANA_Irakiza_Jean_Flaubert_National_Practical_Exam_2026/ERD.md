# Stock Management System (SMS) — Entity Relationship Diagram

StockHub Ltd · Stock Management System

## Relationships inferred from the attributes

- **User ||--o{ Product** — `Product.owner` references `User`; one user owns many products (per-user data visibility).
- **User ||--o{ Warehouse** — `Warehouse.owner` references `User`; one user owns many warehouses.
- **User ||--o{ StockTransaction** — `StockTransaction.owner` references `User`; one user owns many transactions.
- **Product ||--o{ StockTransaction** — `StockTransaction.product` references `Product`; one product appears in many stock movements (one-to-many).
- **Warehouse ||--o{ StockTransaction** — `StockTransaction.warehouse` references `Warehouse`; one warehouse records many stock movements (one-to-many). `StockTransaction` is the linking entity that records the movement of a product through a warehouse.

```mermaid
erDiagram
    USER ||--o{ PRODUCT : owns
    USER ||--o{ WAREHOUSE : owns
    USER ||--o{ STOCKTRANSACTION : owns
    PRODUCT ||--o{ STOCKTRANSACTION : "moved in"
    WAREHOUSE ||--o{ STOCKTRANSACTION : records

    USER {
        ObjectId _id PK
        string fullName
        string username "unique"
        string email "unique"
        string phone "unique"
        string password "hashed, select:false"
        string recoveryCodeHash "hashed, select:false"
        boolean isAdmin
    }

    PRODUCT {
        ObjectId _id PK
        string productCode "unique per owner"
        string productName
        string category
        number quantityInStock
        number unitPrice
        string supplierName
        date dateReceived
        ObjectId owner FK "ref User"
    }

    WAREHOUSE {
        ObjectId _id PK
        string warehouseCode "unique per owner"
        string warehouseName
        string warehouseLocation
        ObjectId owner FK "ref User"
    }

    STOCKTRANSACTION {
        ObjectId _id PK
        ObjectId product FK "ref Product"
        ObjectId warehouse FK "ref Warehouse"
        date transactionDate
        number quantityMoved
        string transactionType "STOCK_IN | STOCK_OUT"
        ObjectId owner FK "ref User"
    }
```
