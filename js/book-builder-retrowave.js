/* Small, DOM-free helpers for the autobiography timeline and route playback. */
(function (root) {
  "use strict";

  function parseTimelineYear(value) {
    const match = String(value || "").match(/\b(?:18|19|20|21)\d{2}\b/);
    return match ? Number(match[0]) : null;
  }

  function sortTimelineItems(items) {
    return (Array.isArray(items) ? items : [])
      .map((item, index) => {
        const explicitYear = Number.isInteger(item?.year) && item.year >= 1800 && item.year <= 2199
          ? item.year
          : null;
        const hasYearField = item && Object.prototype.hasOwnProperty.call(item, "year");
        const year = explicitYear ?? (hasYearField ? null : parseTimelineYear(item?.era || item?.label));
        return { item, index, year };
      })
      .sort((left, right) => {
        if (left.year === null && right.year === null) return left.index - right.index;
        if (left.year === null) return 1;
        if (right.year === null) return -1;
        return left.year - right.year || left.index - right.index;
      })
      .map(({ item, year }) => ({ ...item, year }));
  }

  function pointAlongPolyline(points, progress) {
    const valid = (Array.isArray(points) ? points : [])
      .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!valid.length) return null;
    if (valid.length === 1) return { ...valid[0] };

    const t = Math.max(0, Math.min(1, Number(progress) || 0));
    const lengths = [];
    let total = 0;
    for (let index = 1; index < valid.length; index += 1) {
      const dx = valid[index].x - valid[index - 1].x;
      const dy = valid[index].y - valid[index - 1].y;
      const length = Math.hypot(dx, dy);
      lengths.push(length);
      total += length;
    }
    if (total === 0) return { ...valid[valid.length - 1] };

    let remaining = t * total;
    for (let index = 0; index < lengths.length; index += 1) {
      const length = lengths[index];
      if (remaining <= length || index === lengths.length - 1) {
        const ratio = length ? Math.max(0, Math.min(1, remaining / length)) : 1;
        const from = valid[index];
        const to = valid[index + 1];
        return {
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio
        };
      }
      remaining -= length;
    }
    return { ...valid[valid.length - 1] };
  }

  root.BookBuilderRetrowave = Object.freeze({
    parseTimelineYear,
    sortTimelineItems,
    pointAlongPolyline
  });
})(globalThis);
