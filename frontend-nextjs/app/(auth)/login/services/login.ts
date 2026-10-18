import { api } from "@/lib/api"

export type LoginData = {
  email: string
  password: string
}

export async function login(data: LoginData) {
  await api.post("/api/auth/sign-in/email", data)
}