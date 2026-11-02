import { api } from "@/lib/api"
import {
  completedImageSchema,
  imageUploadSchema,
  userSettingsSchema,
  userUpdateResponseSchema,
} from "../schemas"
import type { UserSettingsData } from "../schemas"

export type UpdateUserData = UserSettingsData & {
  image?: Blob
  removeImage?: boolean
}

export async function updateUser(data: UpdateUserData) {
  const payload: UserSettingsData & { image?: string } =
    userSettingsSchema.parse(data)
  if (data.image) {
    const upload = imageUploadSchema.parse(
      (await api.post("/user-images/upload-url", { key: "user-image" })).data
    )
    const response = await fetch(upload.url, {
      method: upload.method,
      credentials: "omit",
      headers: { ...upload.headers, "Content-Type": data.image.type },
      body: data.image,
    })
    if (!response.ok)
      throw new Error("Não foi possível enviar a foto. Tente novamente.")
    const complete = completedImageSchema.parse(
      (await api.post(`/user-images/${upload.id}/complete`)).data
    )
    if (complete.id !== upload.id)
      throw new Error("Confirmação de imagem inválida.")
    userUpdateResponseSchema.parse(
      (await api.post(`/user-images/${upload.id}/attach`, payload)).data
    )
    return
  }
  if (data.removeImage) {
    userUpdateResponseSchema.parse(
      (await api.delete("/user-images/current", { data: payload })).data
    )
    return
  }
  userUpdateResponseSchema.parse(
    (await api.post("/api/auth/update-user", payload)).data
  )
}
