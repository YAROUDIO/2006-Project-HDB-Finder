This folder holds example data files for skeleton mode.

When copied into `src/data`, you can load these JSON files from your mock API routes if you want file-backed mocks instead of the in-memory `mockUser`.

Example usage (inside an API route):

```ts
import seed from "@/data/seed.json";
```

Note: In the current skeleton, the APIs use in-memory `mockUser` by default.
