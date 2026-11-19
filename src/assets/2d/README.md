# 2D artwork

Place artwork images in this folder or its subfolders. Supported lowercase extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.gif`, `.svg`. Images appear in sorted path order. Restart the development server after adding or removing files.

Optionally add a JSON file next to an image with the same basename, for example `poster.config.json` for `poster.jpg`:

```json
{
  "name": "Poster title",
  "description": "A short description."
}
```

The files in `placeholders/` are temporary carousel previews, not portfolio work. Remove that folder when adding real artwork.

Both fields are optional. The filename is used as the title when `name` is absent or blank. Rebuild for production after changing artwork or metadata. Only add artwork you have permission to publish.
