export function pageTitle(title: string) {
  return `${title} · Waterman College`;
}

export function pageHead(title: string, description?: string) {
  return {
    meta: [
      { title: pageTitle(title) },
      ...(description ? [{ name: "description", content: description }] : []),
    ],
  };
}
