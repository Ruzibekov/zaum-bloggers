import type { ComponentType, SVGProps } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  List,
  MessageSquareText,
  RefreshCw,
  Search,
  Sheet,
  TriangleAlert,
  X,
  type LucideProps,
} from "lucide-react";

type IconProps = SVGProps<SVGSVGElement>;

function lucide(Icon: ComponentType<LucideProps>, name: string) {
  function Wrapped({ width = 18, height = 18, ...props }: IconProps) {
    return (
      <Icon
        width={width}
        height={height}
        strokeWidth={1.75}
        aria-hidden="true"
        focusable="false"
        data-icon={`lucide/${name}`}
        {...(props as LucideProps)}
      />
    );
  }
  Wrapped.displayName = `Icon(${name})`;
  return Wrapped;
}

export const SearchIcon = lucide(Search, "search");
export const CloseIcon = lucide(X, "x");
export const ExternalIcon = lucide(ExternalLink, "external-link");
export const ChevronIcon = lucide(ChevronRight, "chevron-right");
export const ChevronDownIcon = lucide(ChevronDown, "chevron-down");
export const SortIcon = lucide(ArrowUpDown, "arrow-up-down");
export const RefreshIcon = lucide(RefreshCw, "refresh-cw");
export const ArrowIcon = lucide(ArrowRight, "arrow-right");
export const ArrowUpIcon = lucide(ArrowUp, "arrow-up");
export const ArrowDownIcon = lucide(ArrowDown, "arrow-down");
export const CalendarIcon = lucide(Calendar, "calendar");
export const ListIcon = lucide(List, "list");
export const SheetIcon = lucide(Sheet, "sheet");
export const AlertIcon = lucide(TriangleAlert, "triangle-alert");
export const CheckIcon = lucide(Check, "check");
export const CopyIcon = lucide(Copy, "copy");
export const MessageIcon = lucide(MessageSquareText, "message-square-text");
