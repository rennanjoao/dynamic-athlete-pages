import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStickySafe } from "@/hooks/useStickySafe";

const has = () => document.documentElement.classList.contains("sticky-safe");

afterEach(() => document.documentElement.classList.remove("sticky-safe"));

describe("useStickySafe", () => {
  it("liga a classe no <html> enquanto a tela está montada e desliga ao sair", () => {
    const { unmount } = renderHook(() => useStickySafe(true));
    expect(has()).toBe(true);
    unmount();
    expect(has()).toBe(false);
  });

  it("não liga quando inativo e reage à mudança de active", () => {
    const { rerender, unmount } = renderHook(({ on }) => useStickySafe(on), { initialProps: { on: false } });
    expect(has()).toBe(false);
    rerender({ on: true });
    expect(has()).toBe(true);
    rerender({ on: false });
    expect(has()).toBe(false);
    unmount();
  });

  it("duas telas ao mesmo tempo: a classe só sai quando a ÚLTIMA desmonta", () => {
    const a = renderHook(() => useStickySafe(true));
    const b = renderHook(() => useStickySafe(true));
    a.unmount();
    expect(has()).toBe(true);
    b.unmount();
    expect(has()).toBe(false);
  });
});
