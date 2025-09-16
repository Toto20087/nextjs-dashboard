# Database Migrations

This directory contains information about database migrations for the trading platform.

## Overview

The database schema is managed using Prisma migrations. The actual migration files are stored in the `prisma/migrations/` directory at the project root.

## Migration Commands

### Generate Migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Apply Migrations
```bash
npx prisma migrate deploy
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

### View Migration Status
```bash
npx prisma migrate status
```

## Migration Best Practices

1. **Always backup production data** before applying migrations
2. **Test migrations** in a staging environment first
3. **Use descriptive names** for migrations (e.g., `add_user_preferences_table`)
4. **Review generated SQL** before applying to production
5. **Create separate migrations** for schema changes and data migrations

## Common Migration Patterns

### Adding a New Table
```prisma
model NewTable {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("new_table")
}
```

### Adding a New Column
```prisma
model ExistingTable {
  id        Int      @id @default(autoincrement())
  newColumn String?  // Make nullable for existing data
  // ... other fields
}
```

### Adding an Index
```prisma
model Table {
  // ... fields
  
  @@index([field_name])
  @@index([field1, field2]) // Composite index
}
```

### Adding Foreign Key Relationships
```prisma
model Child {
  id       Int    @id @default(autoincrement())
  parentId Int    @map("parent_id")
  parent   Parent @relation(fields: [parentId], references: [id])
  
  @@map("children")
}

model Parent {
  id       Int     @id @default(autoincrement())
  children Child[]
  
  @@map("parents")
}
```

## Data Migrations

For complex data transformations, create separate migration scripts:

```bash
# Create a data migration script
mkdir -p scripts/migrations
touch scripts/migrations/001_migrate_user_data.ts
```

Example data migration:
```typescript
import { prisma } from '../../src/lib/db/prisma'

async function migrateUserData() {
  // Perform data transformation
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Transform data
      },
    })
  }
}

migrateUserData()
  .then(() => {
    console.log('Data migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Data migration failed:', error)
    process.exit(1)
  })
```

## Rollback Procedures

### Schema Rollbacks
Prisma doesn't support automatic rollbacks. For production rollbacks:

1. Create a new migration that reverses the changes
2. Apply the rollback migration
3. Update your application code accordingly

### Data Rollbacks
Always backup data before migrations:

```bash
pg_dump trading_platform > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Production Migration Checklist

- [ ] Database backup created
- [ ] Migration tested in staging
- [ ] Application code updated to handle schema changes
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window
- [ ] Migration applied during low-traffic period

## Troubleshooting

### Migration Failed
1. Check the error message in the console
2. Verify database connectivity
3. Check for data conflicts (unique constraints, foreign keys)
4. Ensure sufficient database permissions

### Schema Drift Detected
```bash
npx prisma db push --accept-data-loss # Development only
```

### Migration History Conflicts
```bash
npx prisma migrate resolve --applied <migration_name>
```

## Environment-Specific Considerations

### Development
- Use `prisma migrate dev` for automatic migration creation and application
- Database resets are acceptable

### Staging
- Use `prisma migrate deploy` to apply migrations
- Test all migration scenarios
- Validate data integrity after migrations

### Production
- Use `prisma migrate deploy` only
- Always backup before migrations
- Apply during maintenance windows
- Monitor application health after migrations

## Schema Evolution Guidelines

1. **Additive Changes**: Always safe (new tables, columns, indexes)
2. **Modification Changes**: Require careful planning (column type changes, constraints)
3. **Destructive Changes**: Require data migration (dropping columns, renaming)

### Safe Column Type Changes
- Increasing varchar length
- Making columns nullable
- Adding default values

### Dangerous Operations
- Dropping columns (data loss)
- Changing column types (potential data loss)
- Adding non-nullable columns to existing tables
- Dropping indexes (performance impact)

## Monitoring Migration Performance

For large tables, monitor migration progress:

```sql
-- Check active connections during migration
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Monitor table locks
SELECT * FROM pg_locks WHERE relation = 'table_name'::regclass;
```