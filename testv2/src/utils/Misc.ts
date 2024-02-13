import * as __ from "lib384/dist/384.esm.js";


export function bytesToMegabytes(bytes: number) {
  if (typeof bytes !== 'number') {
    throw new TypeError('Input must be a number');
  }

  const megabytes = bytes / (1024 * 1024);
  return parseFloat(megabytes.toFixed(2)); // Keep two decimal places
}

export function _sb_assert(val: unknown, msg: string) {
  if (!(val)) {
    const m = `<< SB assertion error: ${msg} >>`;
    // debugger;
    throw new Error(m);
  }
}

export async function generateHash(data: ArrayBuffer) {
  try {
    const digest = await crypto.subtle.digest('SHA-512', data);
    const _id = digest.slice(0, 32);
    const _key = digest.slice(32);
    return {
      id: encodeURIComponent(__.utils.arrayBufferToBase64(_id)),
      key: encodeURIComponent(__.utils.arrayBufferToBase64(_key))
    };
  } catch (e) {
    console.log(e);
    return {};
  }
}

export function text2Thumbnail(text: string, element: HTMLElement & {getContext: (s: string) => CanvasRenderingContext2D} ) {
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

export const getHue = (imgUrl: string) => {
  return new Promise((resolve, reject) => {
      // Load the image
      console.log('getHue imgUrl', imgUrl)
      const image = new Image();
      image.src = imgUrl; // Replace with the URL of your image

      // Wait for the image to load
      image.onload = function () {
          // Create a canvas element
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;

          // Draw the image onto the canvas
          const ctx = canvas.getContext('2d');
          if (ctx === null) console.error('ctx is null')
          ctx!.drawImage(image, 0, 0);

          // Get the pixel data
          const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let totalR = 0;
          let totalG = 0;
          let totalB = 0;
          let pixelCount = 0;

          // Iterate through the pixel data
          for (let i = 0; i < data.length; i += 4) {
              // Extract the RGB values
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Accumulate RGB values
              totalR += r;
              totalG += g;
              totalB += b;

              pixelCount++;
          }

          // Calculate the mean RGB values
          const meanR = Math.round(totalR / pixelCount);
          const meanG = Math.round(totalG / pixelCount);
          const meanB = Math.round(totalB / pixelCount);
          resolve({ r: meanR, g: meanG, b: meanB })
          canvas.remove();
      };
  })
}