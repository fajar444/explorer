export function joinPath(parentPath: string | null, name: string): string {
  if (!parentPath || parentPath === '/') return `/${name}`;
  return `${parentPath}/${name}`;
}

export function extractExtension(name: string): string | null {
  const i = name.lastIndexOf('.');
  if (i <= 0 || i === name.length - 1) return null;
  return name.slice(i + 1).toLowerCase();
}

export function recomputeChildPath(childPath: string, oldPrefix: string, newPrefix: string): string {
  if (childPath === oldPrefix) return newPrefix;
  if (childPath.startsWith(oldPrefix + '/')) {
    return newPrefix + childPath.slice(oldPrefix.length);
  }
  return childPath;
}
