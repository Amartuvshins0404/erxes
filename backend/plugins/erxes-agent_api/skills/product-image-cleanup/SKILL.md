---
name: product-image-cleanup
description: Remove photo backgrounds and set the cut-out as a product image.
---

# Product image cleanup

When the user wants an image background removed, call **removeImageBackground**:

- For an image attached to the message, pass `key`, the exact key from the message's attached-files list.
- For an image given as a public link, pass `url`.
- Set `title` to a short human name for the result, such as the product name.

The transparent PNG opens in Preview at once. Tell the user in one plain sentence that it is ready there. Never expose file keys, URLs, artifact ids, or tool names.

## Set it as a product image

Only when the user asks for the cut-out to be put on a product:

1. Search for the product if needed, then use the exact product `_id` from that result.
2. Call `productsEdit` with the product `_id` and pass the tool result's `attachment` object unchanged as the `attachment` argument. Do not invent or rewrite its fields.

If the tool result has no `attachment` field, the site has no cloud file store. The image can still be downloaded from Preview, but it cannot be attached to a product. Say so in plain terms.

For several photos, process them one at a time. Each call returns its own preview and attachment. Keep the user posted on progress.
