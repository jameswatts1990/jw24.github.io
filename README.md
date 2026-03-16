# jw24.github.io

## Shared persistence on GitHub Pages

This app now supports two persistence modes:

- **Local only (default):** stored in browser `localStorage`.
- **Shared sync (Supabase):** all users read/write the same board data.

### Configure shared sync

1. Create a Supabase project.
2. Create table `boards`:

```sql
create table if not exists boards (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);
```

3. Add RLS policies that allow the app to `select` and `insert/update` the board row you want to share.
4. Open `index.html` and set:

```js
window.KANBAN_REMOTE = {
  url: "https://YOUR_PROJECT.supabase.co",
  apiKey: "YOUR_SUPABASE_ANON_KEY",
  table: "boards",
  boardId: "main"
};
```

5. Deploy to GitHub Pages.

When configured, changes are synced for all users via Supabase.
