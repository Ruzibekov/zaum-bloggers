const CYRILLIC = /[а-яё]/i;

export function errorMessageOf(error: unknown): string {
  if (error instanceof Error && CYRILLIC.test(error.message)) return error.message;
  if (error instanceof DOMException && error.name === "TimeoutError") return "Сервер не ответил вовремя";
  if (error instanceof SyntaxError) return "Файл data.json повреждён или не дочитан";
  if (error instanceof TypeError) return "Нет связи с сервером";
  return "Неизвестная ошибка при загрузке";
}
