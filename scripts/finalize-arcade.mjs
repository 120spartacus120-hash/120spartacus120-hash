import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function finishRound(svg) {
  if (svg.includes('id="arcade-round"')) return svg;
  const duration = Number(svg.match(/<durationMs>(\d+)<\/durationMs>/)?.[1]);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Missing arcade duration');

  const cells = [...svg.matchAll(/<rect\b([^>]*\bid="c-\d+-\d+"[^>]*)>([\s\S]*?)<\/rect>/g)];
  if (!cells.length) throw new Error('No contribution cells in the arcade');
  const fillCounts = new Map();
  for (const [, attributes] of cells) {
    const fill = attributes.match(/\bfill="([^"]+)"/)?.[1];
    if (!fill) throw new Error('A contribution cell has no fill');
    fillCounts.set(fill, (fillCounts.get(fill) || 0) + 1);
  }
  const emptyColor = [...fillCounts].sort((a, b) => b[1] - a[1])[0][0];
  for (const [, attributes, content] of cells) {
    const values = content.match(/<animate\b[^>]*attributeName="fill"[^>]*\bvalues="([^"]+)"/)?.[1];
    const finalColor = values ? values.split(';').at(-1) : attributes.match(/\bfill="([^"]+)"/)?.[1];
    if (finalColor !== emptyColor) throw new Error('Pac-Man did not collect every cell; keeping the previous animation');
  }

  const hold = 1800;
  const fade = 350;
  const loopDuration = duration + hold + fade * 2;
  const timelineRatio = duration / loopDuration;
  let rewrittenAnimations = 0;
  let result = svg.replace(/<animate(?:Transform)?\b[^>]*\/>/g, animation => {
    if (!animation.includes(`dur="${duration}ms"`)) return animation;
    const keyTimes = animation.match(/\bkeyTimes="([^"]+)"/)?.[1];
    const values = animation.match(/\bvalues="([^"]+)"/)?.[1];
    if (!keyTimes || !values) throw new Error('An arcade animation has no complete timeline');
    const times = keyTimes.split(';').map(Number);
    const frames = values.split(';');
    if (times.length !== frames.length || times.some(time => !Number.isFinite(time) || time < 0 || time > 1)) {
      throw new Error('Invalid arcade animation timeline');
    }
    const extendedTimes = [...times.map(time => Number((time * timelineRatio).toFixed(8))), 1];
    const extendedValues = [...frames, frames.at(-1)];
    rewrittenAnimations += 1;
    return animation
      .replace(`dur="${duration}ms"`, `dur="${loopDuration}ms"`)
      .replace(`keyTimes="${keyTimes}"`, `keyTimes="${extendedTimes.join(';')}"`)
      .replace(`values="${values}"`, `values="${extendedValues.join(';')}"`);
  });
  if (!rewrittenAnimations) throw new Error('No arcade timelines were extended');

  result = result.replace('</metadata>', `<loopDurationMs>${loopDuration}</loopDurationMs></metadata>`);
  const roundStart = result.indexOf('</metadata>') + '</metadata>'.length;
  const roundEnd = result.lastIndexOf('</svg>');
  if (roundStart < '</metadata>'.length || roundEnd < roundStart) throw new Error('Invalid arcade SVG');
  const fadeTimes = [0, fade / loopDuration, (duration + hold + fade) / loopDuration, 1]
    .map(time => Number(time.toFixed(8))).join(';');
  const scene = result.slice(roundStart, roundEnd);
  return `${result.slice(0, roundStart)}<g id="arcade-round">${scene}
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="${fadeTimes}" dur="${loopDuration}ms" repeatCount="indefinite"/>
  </g>${result.slice(roundEnd)}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2] || 'dist';
  for (const filename of ['pacman-contribution-graph.svg', 'pacman-contribution-graph-dark.svg']) {
    const filepath = path.join(directory, filename);
    const original = await readFile(filepath, 'utf8');
    await writeFile(filepath, finishRound(original));
    console.log(`Finished round timing for ${filename}`);
  }
}
