import { surfaceYForFillLevel, trophyBounds } from "./cup-fluid";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const w = 400;
const h = 420;
const bounds = trophyBounds(w, h);

const at0 = surfaceYForFillLevel(bounds, 0);
const at100 = surfaceYForFillLevel(bounds, 1);
const at70 = surfaceYForFillLevel(bounds, 0.702);

assert(at0 === bounds.fillBottom, "0% at bottom");
assert(at100 === bounds.fillTop, "100% at rim");
assert(at70 < bounds.fillBottom && at70 > bounds.fillTop, "70% between bottom and top");

const heightRange = bounds.fillBottom - bounds.fillTop;
const heightFraction = (bounds.fillBottom - at70) / heightRange;
assert(
  Math.abs(heightFraction - 0.702) < 0.001,
  `70% fill should be ~70% up the cup height, got ${heightFraction}`,
);

console.log("cup-fluid tests passed");
