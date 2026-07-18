# Northstar Commerce Fixture

This generated repository models a multi-tenant content platform. Shared theme
defaults live under `src/themes`, tenant overrides live under `clients`, and
rendering code lives under `src/rendering`.

Run the complete test suite with:

```sh
npm test
```

The numerous generated packages and tenant files are deterministic benchmark
noise. They make repository inspection realistic while keeping the fixture
safe, public, and dependency-free.
