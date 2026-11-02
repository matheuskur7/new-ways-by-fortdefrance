import axios from "axios"
import { BACKEND_PROXY_PATH } from "@/lib/backend-proxy"
import { requestSessionCheck } from "@/lib/session-events"

export const api = axios.create({
  baseURL: BACKEND_PROXY_PATH,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !/^\/api\/auth\/sign-(in|up)(\/|$)/.test(error.config?.url ?? "")
    ) {
      // O 401 pode ser tardio: confirma a sessão atual antes de redirecionar.
      requestSessionCheck()
    }
    return Promise.reject(error)
  }
)

/** Status HTTP de uma falha do cliente `api`, ou `undefined` sem resposta. */
export function getHttpStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

/** Código de erro do Better Auth (por exemplo, `EMAIL_NOT_VERIFIED`), quando presente. */
export function getErrorCode(error: unknown) {
  if (!axios.isAxiosError(error)) return undefined
  const data: unknown = error.response?.data
  return data &&
    typeof data === "object" &&
    "code" in data &&
    typeof data.code === "string"
    ? data.code
    : undefined
}

/** Garante que o servidor confirmou a operação com 204 No Content. */
export function expectNoContent(response: { status: number }, message: string) {
  if (response.status !== 204) throw new Error(message)
}
