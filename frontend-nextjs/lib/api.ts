import axios from "axios"
import { requestSessionCheck } from "@/lib/session-events"

export const api = axios.create({
  baseURL: "/backend",
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
