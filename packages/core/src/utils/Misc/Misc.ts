import * as __ from "lib384/dist/384.esm.js";


export function bytesToMegabytes(bytes: number): number {
  if (typeof bytes !== 'number') {
    throw new TypeError('Input must be a number');
  }

  const megabytes = bytes / (1024 * 1024);
  return parseFloat(megabytes.toFixed(2)); // Keep two decimal places
}

export function _sb_assert(val: unknown, msg: string): asserts val is NonNullable<unknown> {
  if (!(val)) {
    const m = `<< SB assertion error: ${msg} >>`;
    // debugger;
    throw new Error(m);
  }
}

export async function generateHash(data: ArrayBuffer): Promise<{ id: string, key: string } | null> {
  try {
    const digest = await crypto.subtle.digest('SHA-512', data);
    const _id = digest.slice(0, 32);
    const _key = digest.slice(32);
    return {
      id: encodeURIComponent(__.utils.arrayBufferToBase64(_id)),
      key: encodeURIComponent(__.utils.arrayBufferToBase64(_key))
    };
  } catch (e) {
    if (e instanceof Error)
      console.log(e);

    return null;
  }
}

export function text2Thumbnail(text: string, element: HTMLElement & { getContext: (s: string) => CanvasRenderingContext2D }): void {
  var canvas = element;
  var context = canvas.getContext("2d");
  var v = 50;
  const h = 550;
  const fs = 7;
  const lm = 15;
  const lx = 92;
  context.font = `${fs}px monospace`;
  for (let l of text.split(/[\r\n\f\v]/)) {
    context.fillText(l.slice(0, lx), lm, v);
    v += (fs + 1);
    console.log(l);
    if (v > h) {
      break;
    }
  }
}