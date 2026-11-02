export const USER_IMAGE_TARGET_BYTES = 50_000
export const USER_IMAGE_MAX_DIMENSION = 512

type CropArea = { x: number; y: number; width: number; height: number }

function encode(canvas: HTMLCanvasElement, format: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Falha ao processar a foto.")),
      format,
      quality
    )
  })
}

export async function prepareUserImage(source: string, area: CropArea) {
  const image = new window.Image()
  image.src = source
  await image.decode()
  const canvas = document.createElement("canvas")
  const initialSize = Math.min(
    USER_IMAGE_MAX_DIMENSION,
    Math.max(1, Math.floor(Math.min(area.width, area.height)))
  )
  const sizes = [...new Set([initialSize, 384, 256, 192])].filter(
    (size) => size <= initialSize
  )
  for (const size of sizes) {
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Não foi possível processar a foto.")
    context.drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      size,
      size
    )
    for (const quality of [0.8, 0.75, 0.7, 0.65, 0.6, 0.55]) {
      let blob = await encode(canvas, "image/webp", quality)
      if (blob.type !== "image/webp") {
        // Alguns navegadores não exportam WebP; JPEG mantém o limite de tamanho.
        context.globalCompositeOperation = "destination-over"
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, size, size)
        context.globalCompositeOperation = "source-over"
        blob = await encode(canvas, "image/jpeg", quality)
      }
      if (blob.size <= USER_IMAGE_TARGET_BYTES) return blob
    }
  }
  throw new Error(
    "Não foi possível reduzir a foto para 50 KB. Escolha outra imagem."
  )
}
