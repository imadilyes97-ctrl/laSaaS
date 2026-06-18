/**
 * Fonction utilitaire pour les appels fetch avec timeout
 * Empêche les appels externes de bloquer indéfiniment
 */

export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`⏰ Timeout après ${timeout}ms pour:`, input)
    controller.abort()
  }, timeout)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('❌ Fetch timeout ou erreur:', error)
    throw error
  }
}