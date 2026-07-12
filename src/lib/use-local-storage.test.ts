// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useLocalStorage } from "./use-local-storage"

function renderUseLocalStorage<T>(key: string, initialValue: T) {
  return renderHook(() => useLocalStorage(key, initialValue))
}

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns initial value when localStorage is empty", () => {
    const { result } = renderUseLocalStorage("test-key", "default")
    expect(result.current[0]).toBe("default")
  })

  it("reads existing value from localStorage", () => {
    localStorage.setItem("existing-key", JSON.stringify("stored-value"))
    const { result } = renderUseLocalStorage("existing-key", "default")
    expect(result.current[0]).toBe("stored-value")
  })

  it("sets value and persists to localStorage", () => {
    const { result } = renderUseLocalStorage("set-test", "")
    act(() => {
      result.current[1]("new-value")
    })
    expect(result.current[0]).toBe("new-value")
    expect(JSON.parse(localStorage.getItem("set-test")!)).toBe("new-value")
  })

  it("supports functional updates", () => {
    const { result } = renderUseLocalStorage("func-test", 0)
    act(() => {
      result.current[1]((prev) => prev + 10)
    })
    expect(result.current[0]).toBe(10)
  })

  it("works with complex objects", () => {
    const { result } = renderUseLocalStorage("obj-test", { items: [], count: 0 })
    act(() => {
      result.current[1]({ items: [1, 2, 3], count: 3 })
    })
    expect(result.current[0]).toEqual({ items: [1, 2, 3], count: 3 })
  })

  it("works with arrays", () => {
    const { result } = renderUseLocalStorage<number[]>("arr-test", [])
    act(() => {
      result.current[1]([1, 2, 3])
    })
    expect(result.current[0]).toEqual([1, 2, 3])
  })

  it("persists across re-renders", () => {
    const { result, rerender } = renderUseLocalStorage("persist-test", "initial")
    act(() => {
      result.current[1]("updated")
    })
    rerender()
    expect(result.current[0]).toBe("updated")
  })
})
