/** Move `sourceId` para a posição de `targetId`, sem alterar a lista original. */
export function moveIds(
  ids: string[],
  sourceId: string,
  targetId: string
): string[] {
  const source = ids.indexOf(sourceId)
  const target = ids.indexOf(targetId)
  if (source < 0 || target < 0 || source === target) return ids

  const reordered = [...ids]
  reordered.splice(source, 1)
  reordered.splice(target, 0, sourceId)

  return reordered
}

/** Posição de um novo grupo: depois do último, dentro do limite do smallint. */
export function nextDisplayOrder(orders: number[]) {
  return Math.min(Math.max(-1, ...orders) + 1, 32767)
}

/**
 * Aplica uma ordem em edição aos itens atuais: ids que não existem mais são
 * descartados e itens ainda fora da ordem entram no final, na ordem recebida.
 */
export function applyOrder<T extends { id: string }>(
  items: T[],
  order: string[] | null
): T[] {
  if (!order) return items
  const byId = new Map(items.map((item) => [item.id, item]))
  const known = new Set(order)
  return [
    ...order.flatMap((id) => byId.get(id) ?? []),
    ...items.filter((item) => !known.has(item.id)),
  ]
}
