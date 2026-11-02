import assert from "node:assert/strict"
import { test } from "node:test"
import { moveGroupIds } from "../app/(private)/configuracoes/taxas/reorder-groups.ts"

test("move grupos em ambas as direções sem alterar a lista original", () => {
  const ids = ["a", "b", "c", "d"]
  assert.deepEqual(moveGroupIds(ids, "a", "c"), ["b", "c", "a", "d"])
  assert.deepEqual(moveGroupIds(ids, "d", "a"), ["d", "a", "b", "c"])
  assert.deepEqual(ids, ["a", "b", "c", "d"])
  assert.equal(moveGroupIds(ids, "a", "a"), ids)
  assert.equal(moveGroupIds(ids, "missing", "a"), ids)
})
