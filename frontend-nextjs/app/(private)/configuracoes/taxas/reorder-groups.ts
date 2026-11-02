export function moveGroupIds(
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
