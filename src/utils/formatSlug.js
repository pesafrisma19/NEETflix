export default function formatSlug(title, id) {
  if (!title) return id;
  const slug = title
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug}-${id}`;
}
