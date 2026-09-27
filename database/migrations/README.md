# Database Migrations

## Overview
Database migrations track changes to the database schema over time.

## Migration Naming Convention
Migrations follow the pattern: `XXX_description.sql`
- XXX: Sequential number (001, 002, 003, etc.)
- description: Brief description in snake_case

## Available Migrations

### 001_create_initial_schema.sql
- Creates all initial tables
- Sets up indexes and foreign keys
- Initial schema for AttendX

## Running Migrations

### All Migrations
```bash
mysql -h localhost -u root -p attendx < migrations/001_create_initial_schema.sql
```

### Single Migration
```bash
mysql -h localhost -u root -p attendx < migrations/001_create_initial_schema.sql
```

## Creating New Migrations

1. Create a new file with the next sequential number
2. Write your SQL changes
3. Test on development database
4. Document changes in this README
5. Run on production (with backup!)

## Migration Best Practices

- Always backup before running migrations
- Test on development first
- Use transactions when possible
- Document all changes
- Never modify existing migrations
- Create new migrations for changes
