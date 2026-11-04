const TIP_EDGE = 8;

export function edgeShift(left: number, right: number, viewport: number): number {
  if (left < TIP_EDGE) return TIP_EDGE - left;
  if (right > viewport - TIP_EDGE) return viewport - TIP_EDGE - right;
  return 0;
}
