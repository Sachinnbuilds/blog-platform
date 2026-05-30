# Local Demo Seed

This folder contains manual demo data for the V3 local prototype. It is not a
Flyway migration and is not loaded automatically by the app.

## Demo Accounts

All demo accounts use the same password:

```text
DemoPass123!
```

Accounts:

- `admin` - admin user
- `maya` - author with published posts and one draft
- `devon` - author with published posts
- `reader` - reader account with interests and follows

## Apply Seed

From PowerShell, with PostgreSQL available locally:

```powershell
psql -U postgres -d blog_platform -f D:\dev\Blog\blog-platform\scripts\local-demo-seed.sql
```

If your database credentials differ from `application.properties`, set the
usual PostgreSQL environment variables first, for example:

```powershell
$env:PGPASSWORD = "newpassword"
psql -U postgres -d blog_platform -f D:\dev\Blog\blog-platform\scripts\local-demo-seed.sql
```

The script is idempotent: running it repeatedly updates the same demo accounts,
posts, tags, follows, likes, comments, interests, and denormalized counts.
