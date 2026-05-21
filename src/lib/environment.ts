export function getEnvironment(): string {
  return process.env.ENVIRONMENT ?? 'development';
}
