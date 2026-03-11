const runtimeBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function isExternalPath(path: string) {
  return /^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:");
}

export function withBasePath(path?: string) {
  if (!path) {
    return path;
  }

  if (isExternalPath(path)) {
    return path;
  }

  if (
    runtimeBasePath &&
    (path === runtimeBasePath || path.startsWith(`${runtimeBasePath}/`))
  ) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${runtimeBasePath}${path}`;
  }

  return runtimeBasePath ? `${runtimeBasePath}/${path}` : path;
}

export function getRuntimeBasePath() {
  return runtimeBasePath;
}
