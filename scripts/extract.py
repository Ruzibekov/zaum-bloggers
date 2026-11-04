#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

import openpyxl

COLUMNS = {
    "row": ("№",),
    "article": ("артикул",),
    "blogger": ("блогер",),
    "platform": ("площадка",),
    "budget": ("категория бюджета",),
    "followers": ("подписчики",),
    "audienceAge": ("возраст аудитории",),
    "audienceGeo": ("гео аудитории",),
    "storiesReach": ("охват сторис",),
    "reelsViews": ("просмотры рилс",),
    "cost": ("стоимость размещения",),
    "productCost": ("себестоимость товара",),
    "format": ("формат рекламы",),
    "status": ("статус",),
    "date": ("дата рекламы",),
    "adUrl": ("ссылка на рекламу",),
    "comment": ("комментарий",),
}
REQUIRED = ("blogger", "status")
NUMERIC = ("followers", "storiesReach", "reelsViews", "cost", "productCost")
STAGES = (
    ("approval", ("согласован",)),
    ("scheduled", ("запланир",)),
    ("published", ("опубликов",)),
    ("results", ("результат",)),
)
BUDGETS = (("paid", ("плат",)), ("barter", ("бартер",)))


def header_key(value: object) -> str:
    text = str(value or "").strip().lower().replace("ё", "е")
    return re.sub(r"\s*,\s*₽\s*$", "", text).strip()


def map_columns(header: tuple[object, ...]) -> dict[str, int]:
    keys = [header_key(cell) for cell in header]
    mapping: dict[str, int] = {}
    for field, aliases in COLUMNS.items():
        for index, key in enumerate(keys):
            if key in aliases:
                mapping[field] = index
                break
    missing = [field for field in REQUIRED if field not in mapping]
    if missing:
        raise SystemExit(f"Missing required columns: {', '.join(missing)}")
    return mapping


def text(value: object) -> str | None:
    if value is None:
        return None
    result = re.sub(r"\s+", " ", str(value)).strip()
    return result or None


def number(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    raw = text(value)
    if raw is None or raw.startswith("="):
        return None
    cleaned = re.sub(r"[\s\u00a0\u202f₽%]", "", raw).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def iso_date(value: object) -> str | None:
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    raw = text(value)
    if raw is None:
        return None
    match = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})", raw)
    if match:
        year, month, day = (int(part) for part in match.groups())
    else:
        match = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})", raw)
        if not match:
            return None
        day, month, year = (int(part) for part in match.groups())
    try:
        return dt.date(year, month, day).isoformat()
    except ValueError:
        return None


def classify(
    value: str | None, table: tuple[tuple[str, tuple[str, ...]], ...]
) -> str | None:
    if value is None:
        return None
    lowered = value.lower().replace("ё", "е")
    for key, prefixes in table:
        if any(prefix in lowered for prefix in prefixes):
            return key
    return None


def safe_url(value: object) -> str | None:
    raw = text(value)
    if raw and re.match(r"^https?://", raw, re.IGNORECASE):
        return raw
    return None


def as_int(value: float | None) -> int | float | None:
    if value is None:
        return None
    return int(value) if float(value).is_integer() else value


def normalize(
    cells: tuple[object, ...], mapping: dict[str, int], index: int
) -> dict[str, object] | None:
    def cell(field: str) -> object:
        position = mapping.get(field)
        return (
            cells[position] if position is not None and position < len(cells) else None
        )

    blogger = text(cell("blogger"))
    if blogger is None:
        return None
    status = text(cell("status"))
    budget = text(cell("budget"))
    row_number = number(cell("row"))
    article = text(cell("article"))
    values = {field: as_int(number(cell(field))) for field in NUMERIC}
    return {
        "id": article or f"row-{index}",
        "row": int(row_number) if row_number is not None else index,
        "article": article,
        "blogger": blogger,
        "platform": text(cell("platform")),
        "budget": classify(budget, BUDGETS),
        "budgetLabel": budget,
        "followers": values["followers"],
        "audienceAge": text(cell("audienceAge")),
        "audienceGeo": text(cell("audienceGeo")),
        "storiesReach": values["storiesReach"],
        "reelsViews": values["reelsViews"],
        "cost": values["cost"],
        "productCost": values["productCost"],
        "format": text(cell("format")),
        "stage": classify(status, STAGES) or "other",
        "statusLabel": status,
        "date": iso_date(cell("date")),
        "adUrl": safe_url(cell("adUrl")),
        "comment": text(cell("comment")),
    }


def unique_ids(rows: list[dict[str, object]]) -> None:
    seen: dict[str, int] = {}
    for row in rows:
        base = str(row["id"])
        count = seen.get(base, 0)
        seen[base] = count + 1
        if count:
            row["id"] = f"{base}-{count + 1}"


def extract(source: Path, sheet_name: str | None) -> dict[str, object]:
    workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
    sheet = workbook[sheet_name] if sheet_name else workbook.worksheets[0]
    rows = sheet.iter_rows(values_only=True)
    header = next(rows, None)
    if header is None:
        raise SystemExit(f"Sheet «{sheet.title}» is empty")
    mapping = map_columns(header)
    placements = []
    for index, cells in enumerate(rows, start=1):
        item = normalize(cells, mapping, index)
        if item is not None:
            placements.append(item)
    unique_ids(placements)
    return {
        "generatedAt": dt.date.today().isoformat(),
        "source": {"kind": "file", "title": sheet.title},
        "placements": placements,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert the ZAUM demo bloggers spreadsheet to JSON"
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("target", type=Path)
    parser.add_argument("--sheet", default=None)
    args = parser.parse_args()
    dataset = extract(args.source, args.sheet)
    args.target.parent.mkdir(parents=True, exist_ok=True)
    args.target.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(dataset['placements'])} rows → {args.target}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
