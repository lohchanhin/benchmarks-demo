# Architecture

Northstar uses a shared-default, tenant-override theme model. A tenant may
override a field, while omitted fields inherit the shared value. Rendering
code resolves this merge at runtime.

The platform intentionally keeps tenant configuration separate from shared
defaults so a client-specific request cannot change every storefront.
