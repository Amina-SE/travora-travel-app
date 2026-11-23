// Builds the seat map for every vehicle/class pair.
// Each layout is physically different: 3-3 economy, herringbone business pods,
// first-class suites with doors, 2+1 coaches, captain recliners, train bays and sleeper cabins.
import { rng } from './data';

const LETTERS = 'ABCDEFGHJK';

function seatRow({ rowNo, pattern, r, price, takenRate, extra = () => 0, tag = () => null, rotate = () => 0, label }) {
  // pattern: string like 'AAA_AAA' where A = seat and _ = aisle
  let letterIdx = 0;
  const cells = [];
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '_') {
      cells.push({ kind: 'aisle', key: `a${i}` });
    } else if (ch === '.') {
      cells.push({ kind: 'space', key: `s${i}` });
    } else {
      const letter = LETTERS[letterIdx++];
      const id = `${rowNo}${letter}`;
      const isWindow = i === 0 || i === pattern.length - 1;
      cells.push({
        kind: 'seat',
        key: id,
        id,
        letter,
        taken: r() < takenRate,
        window: isWindow,
        price: price + extra({ isWindow, i }),
        tag: tag({ isWindow, i }),
        rotate: rotate({ i, rowNo }),
      });
    }
  }
  return { kind: 'seats', key: `row${rowNo}`, label: label ?? String(rowNo), cells };
}

export function buildDeck(mode, cls, basePrice, seed) {
  const r = rng(`${mode}-${cls}-${seed}`);

  if (mode === 'flight' && cls === 'economy') {
    const rows = [];
    const price = basePrice;
    for (let n = 20; n < 34; n++) {
      const exit = n === 26;
      if (exit) rows.push({ kind: 'exit', key: 'exit' });
      rows.push(seatRow({
        rowNo: n, pattern: 'AAA_AAA', r, price, takenRate: exit ? 0.2 : 0.42,
        extra: ({ isWindow }) => (isWindow ? 12 : 0) + (exit ? 25 : 0) + (n < 23 ? 15 : 0),
        tag: ({ isWindow }) => (exit ? 'Extra legroom' : n < 23 ? 'Quick exit' : isWindow ? 'Window' : null),
      }));
    }
    return { shell: 'plane', style: 'eco', seatW: 30, seatH: 32, aisleW: 24, gap: 5, rowGap: 7, wings: [5, 10], rows, zones: [] };
  }

  if (mode === 'flight' && cls === 'business') {
    const rows = [{ kind: 'zone', key: 'lounge', zone: { id: 'lounge', icon: 'coffee', title: 'Lounge bar', sub: 'Tap to add lounge access' } }];
    for (let n = 1; n <= 6; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'A_AA_A', r, price: basePrice, takenRate: 0.35,
        extra: ({ isWindow }) => (isWindow ? 40 : 0),
        tag: ({ isWindow }) => (isWindow ? 'Window pod, direct aisle access' : 'Centre pair, ideal for two'),
        rotate: ({ i }) => (i < 3 ? 18 : -18),
      }));
    }
    return { shell: 'plane', style: 'biz', seatW: 44, seatH: 58, aisleW: 26, gap: 10, rowGap: 14, rows, zones: ['lounge'] };
  }

  if (mode === 'flight' && cls === 'first') {
    const rows = [{ kind: 'zone', key: 'onboard', zone: { id: 'lounge', icon: 'star', title: 'Onboard lounge', sub: 'Included with every suite' } }];
    for (let n = 1; n <= 3; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'A_A_A', r, price: basePrice, takenRate: 0.3,
        extra: ({ i }) => (i === 2 ? 0 : 80),
        tag: ({ i }) => (i === 2 ? 'Centre suite with sliding doors' : 'Window suite with private minibar'),
      }));
    }
    rows.push({ kind: 'zone', key: 'spa', zone: { id: 'spa', icon: 'droplet', title: 'Shower spa', sub: 'Book a 25-minute slot after boarding' } });
    return { shell: 'plane', style: 'first', seatW: 66, seatH: 82, aisleW: 22, gap: 8, rowGap: 16, rows, zones: ['lounge', 'spa'] };
  }

  if (mode === 'bus' && cls === 'standard') {
    const rows = [];
    for (let n = 1; n <= 11; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'AA_AA', r, price: basePrice, takenRate: 0.45,
        extra: ({ isWindow }) => (isWindow ? 2 : 0) + (n <= 2 ? 3 : 0),
        tag: ({ isWindow }) => (n <= 2 ? 'Front view' : isWindow ? 'Window' : null),
      }));
    }
    return { shell: 'bus', style: 'busStd', seatW: 32, seatH: 34, aisleW: 30, gap: 6, rowGap: 8, rows, zones: [] };
  }

  if (mode === 'bus' && cls === 'executive') {
    const rows = [];
    for (let n = 1; n <= 9; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'A_AA', r, price: basePrice, takenRate: 0.38,
        extra: ({ isWindow, i }) => (i === 0 ? 4 : 0),
        tag: ({ i }) => (i === 0 ? 'Solo seat with side table' : 'Pair seat'),
      }));
    }
    return { shell: 'bus', style: 'busExec', seatW: 40, seatH: 44, aisleW: 34, gap: 8, rowGap: 10, rows, zones: [] };
  }

  if (mode === 'bus' && cls === 'royal') {
    const rows = [];
    for (let n = 1; n <= 5; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'A_A', r, price: basePrice, takenRate: 0.3,
        tag: () => 'Captain recliner with leg rest',
      }));
    }
    rows.push({ kind: 'zone', key: 'vip', zone: { id: 'vip', icon: 'music', title: 'Private lounge cabin', sub: 'Sofas, mood lighting, sound system' } });
    return { shell: 'bus', style: 'busRoyal', seatW: 58, seatH: 58, aisleW: 54, gap: 10, rowGap: 14, rows, zones: ['vip'] };
  }

  if (mode === 'train' && cls === 'economy') {
    const rows = [];
    for (let n = 1; n <= 12; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'AA_AAA', r, price: basePrice, takenRate: 0.5,
        rotate: () => (n % 2 === 1 ? 180 : 0),
        tag: ({ isWindow }) => (isWindow ? 'Window, table bay' : 'Table bay'),
        extra: ({ isWindow }) => (isWindow ? 2 : 0),
      }));
      if (n % 2 === 1) rows.push({ kind: 'table', key: `t${n}`, pattern: 'AA_AAA' });
    }
    return { shell: 'train', style: 'trainEco', seatW: 30, seatH: 30, aisleW: 24, gap: 5, rowGap: 5, rows, zones: [] };
  }

  if (mode === 'train' && cls === 'business') {
    const rows = [];
    for (let n = 1; n <= 9; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'A_AA', r, price: basePrice, takenRate: 0.35,
        rotate: () => (n <= 4 ? 180 : 0),
        tag: ({ i }) => (i === 0 ? 'Solo armchair' : 'Paired armchair'),
      }));
    }
    return { shell: 'train', style: 'trainBiz', seatW: 40, seatH: 42, aisleW: 34, gap: 8, rowGap: 10, rows, zones: [] };
  }

  if (mode === 'train' && cls === 'first') {
    const rows = [{ kind: 'zone', key: 'dining', zone: { id: 'dining', icon: 'coffee', title: 'Dining car', sub: 'Three-course meal, tap to reserve a table' } }];
    for (let n = 1; n <= 7; n++) {
      rows.push(seatRow({
        rowNo: n, pattern: 'A_A', r, price: basePrice, takenRate: 0.3,
        rotate: () => (n <= 3 ? 180 : 0),
        tag: () => 'Solo recliner with window and table',
      }));
    }
    return { shell: 'train', style: 'trainFirst', seatW: 56, seatH: 56, aisleW: 56, gap: 10, rowGap: 14, rows, zones: ['dining'] };
  }

  // Sleeper: private compartments with four berths each.
  const rows = [];
  for (let n = 1; n <= 6; n++) {
    const berths = ['L1', 'U1', 'L2', 'U2'].map((b) => ({
      kind: 'seat',
      key: `C${n}${b}`,
      id: `C${n}-${b}`,
      letter: b,
      taken: r() < 0.4,
      price: basePrice + (b[0] === 'L' ? 6 : 0),
      tag: b[0] === 'L' ? 'Lower berth, window side' : 'Upper berth, reading light',
      rotate: 0,
    }));
    rows.push({ kind: 'cabin', key: `cab${n}`, label: `Cabin ${n}`, cells: berths });
  }
  return { shell: 'train', style: 'sleeper', seatW: 70, seatH: 26, aisleW: 30, gap: 8, rowGap: 12, rows, zones: [] };
}

// Pixel geometry so the screen can size the shell and the scroll range.
export function deckGeometry(deck) {
  const firstSeats = deck.rows.find((r) => r.kind === 'seats');
  let inner;
  if (deck.style === 'sleeper') {
    inner = deck.seatW * 2 + deck.gap + deck.aisleW;
  } else {
    const p = firstSeats.cells;
    inner = p.reduce((sum, c) => sum + (c.kind === 'aisle' ? deck.aisleW : deck.seatW), 0) + deck.gap * (p.length - 1); // row numbers sit in the aisle
  }
  let h = 0;
  deck.rows.forEach((row) => {
    if (row.kind === 'seats') h += deck.seatH + deck.rowGap;
    else if (row.kind === 'zone') h += 66 + deck.rowGap;
    else if (row.kind === 'exit') h += 22;
    else if (row.kind === 'table') h += 12 + deck.rowGap;
    else if (row.kind === 'cabin') h += deck.seatH * 2 + 26 + deck.rowGap;
  });
  return { innerW: inner, innerH: h };
}
