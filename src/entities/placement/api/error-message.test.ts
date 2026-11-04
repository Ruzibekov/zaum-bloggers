import { describe, expect, it } from "vitest";
import { errorMessageOf } from "./error-message";

describe("errorMessageOf", () => {
  it("keeps messages already written in Russian", () => {
    expect(errorMessageOf(new Error("Таблица закрыта"))).toBe("Таблица закрыта");
  });

  it("maps browser network failures to Russian", () => {
    expect(errorMessageOf(new TypeError("Failed to fetch"))).toBe("Нет связи с сервером");
    expect(errorMessageOf(new TypeError("NetworkError when attempting to fetch resource."))).toBe("Нет связи с сервером");
  });

  it("maps broken JSON and timeouts", () => {
    expect(errorMessageOf(new SyntaxError("Unexpected token < in JSON"))).toBe("Файл data.json повреждён или не дочитан");
    expect(errorMessageOf(new DOMException("signal timed out", "TimeoutError"))).toBe("Сервер не ответил вовремя");
  });

  it("never leaks unknown English text or non-errors", () => {
    expect(errorMessageOf(new Error("Something odd"))).toBe("Неизвестная ошибка при загрузке");
    expect(errorMessageOf("boom")).toBe("Неизвестная ошибка при загрузке");
  });
});
