/**
 * Safely execute database queries with error handling.
 * If the query fails (e.g., table doesn't exist), returns default value instead of throwing.
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  context?: string,
): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    console.log(
      `[v0] Database query failed${context ? ` (${context})` : ""}, returning default value:`,
      error instanceof Error ? error.message : error,
    )
    return defaultValue
  }
}
