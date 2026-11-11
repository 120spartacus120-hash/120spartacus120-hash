import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const username = '120spartacus120-hash';
const outputDirectory = process.argv[2] || 'dist';
const dataFile = process.argv[3];
const query = `query {
  user(login: "${username}") {
    login
    followers { totalCount }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel weekday } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false,
      orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        name url description stargazerCount forkCount
        languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
        releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
          nodes { tagName }
        }
      }
    }
  }
}`;

async function loadProfile() {
  if (dataFile) return JSON.parse((await readFile(dataFile, 'utf8')).replace(/^\uFEFF/, ''));
  if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN is required to update profile data');
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'spartacus-profile',
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
  return response.json();
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

function svg(width, height, title, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  <defs>
    <linearGradient id="panel" x2="1" y2="1">
      <stop stop-color="#19162d"/><stop offset="1" stop-color="#0c101c"/>
    </linearGradient>
    <linearGradient id="accent"><stop stop-color="#d6bcff"/><stop offset=".5" stop-color="#a286ff"/><stop offset="1" stop-color="#79d9ff"/></linearGradient>
    <radialGradient id="aura"><stop stop-color="#a56aff" stop-opacity=".5"/><stop offset=".5" stop-color="#7650d5" stop-opacity=".2"/><stop offset="1" stop-color="#7650d5" stop-opacity="0"/></radialGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    .mono { font-family: 'Cascadia Code', Consolas, monospace; }
    .muted { fill: #a6a5bf; }
    @keyframes breathe { 0%,100% { opacity:.45; } 50% { opacity:1; } }
    @keyframes rotate { to { transform:rotate(360deg); } }
    .breathing { animation:breathe 5s ease-in-out infinite; }
    .orbit { transform-box:fill-box; transform-origin:center; animation:rotate 36s linear infinite; }
    @media (prefers-reduced-motion:reduce) { .orbit,.breathing { animation:none; } }
  </style>
  ${content}
</svg>\n`;
}

function panel(width, height) {
  return `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="26" fill="url(#panel)" stroke="#35304e"/>`;
}

function banner() {
  const particles = Array.from({ length: 20 }, (_, index) => {
    const x = 785 + (index * 71) % 340;
    const y = 70 + (index * 43) % 260;
    return `<circle cx="${x}" cy="${y}" r="${index % 3 + 1}" fill="#ceacff" opacity=".55">
      <animate attributeName="cy" values="${y + 15};${y - 35};${y + 15}" dur="${5 + index % 5}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".1;.8;.1" dur="${4 + index % 4}s" repeatCount="indefinite"/>
    </circle>`;
  }).join('\n');
  const flames = Array.from({ length: 9 }, (_, index) => {
    const angle = index * 40;
    return `<g transform="translate(935 218) rotate(${angle})">
      <path d="M -48 -103 C -95 -141, 5 -170, -29 -216 C 51 -183, 26 -135, 50 -105" fill="none" stroke="${index % 2 ? '#9c72fb' : '#dfb7ff'}" stroke-width="${index % 2 ? 7 : 3}" opacity=".45" filter="url(#glow)">
        <animate attributeName="d" values="M -48 -103 C -95 -141, 5 -170, -29 -216 C 51 -183, 26 -135, 50 -105;M -48 -103 C -38 -161, -25 -147, 8 -231 C 74 -174, 1 -140, 50 -105;M -48 -103 C -95 -141, 5 -170, -29 -216 C 51 -183, 26 -135, 50 -105" dur="${4 + index % 3}s" repeatCount="indefinite"/>
      </path>
    </g>`;
  }).join('\n');
  return svg(1200, 420, 'SPARTACUS — создаю Aura и JARVIS', `${panel(1200, 420)}
    <ellipse cx="940" cy="215" rx="290" ry="225" fill="url(#aura)" class="breathing"/>
    <path d="M 45 340 H 630 L 688 282 H 795 M 45 351 H 300" stroke="#403455" stroke-width="1" fill="none"/>
    <text x="54" y="57" class="mono" font-size="13" letter-spacing="3" fill="#baa3f6">${username.toUpperCase()}</text>
    <circle cx="54" cy="115" r="4" fill="#c4a2ff" class="breathing"/>
    <text x="69" y="120" font-size="13" letter-spacing="3" fill="#beb4d7">ИДЕИ ПРИОБРЕТАЮТ ФОРМУ</text>
    <text x="49" y="213" font-size="78" font-weight="800" letter-spacing="-3" fill="url(#accent)">SPARTACUS</text>
    <text x="55" y="260" font-size="24" fill="#e7e1f5">Создаю приложения с характером.</text>
    <text x="55" y="299" font-size="17" class="muted">Мессенджеры, голосовые помощники и удобные интерфейсы.</text>
    <g transform="translate(55 361)">
      <rect width="104" height="30" rx="15" fill="#9a72f6" fill-opacity=".12" stroke="#6a4d9e"/>
      <text x="52" y="20" text-anchor="middle" font-size="12" fill="#d1bbff" letter-spacing="2">AURA</text>
      <rect x="116" width="118" height="30" rx="15" fill="#5babd7" fill-opacity=".1" stroke="#385675"/>
      <text x="175" y="20" text-anchor="middle" font-size="12" fill="#a2d9ff" letter-spacing="2">JARVIS</text>
    </g>
    ${flames}
    <g class="orbit" opacity=".6">
      <ellipse cx="935" cy="218" rx="142" ry="142" stroke="#b892ff" fill="none" stroke-width="1" stroke-dasharray="100 35 4 35"/>
      <circle cx="1077" cy="218" r="4" fill="#dbbfff"/>
    </g>
    <circle cx="935" cy="218" r="108" fill="#211a3c" stroke="#c2a0ff" stroke-width="2"/>
    <circle cx="935" cy="218" r="94" fill="none" stroke="#5f478a"/>
    <path d="M 969 174 H 914 Q 897 174 897 192 Q 897 208 915 211 L 952 218 Q 972 222 972 241 Q 972 261 952 261 H 900" stroke="url(#accent)" stroke-width="12" stroke-linecap="round" fill="none"/>
    ${particles}`);
}

function typing() {
  const messages = [
    'Создаю Aura — мессенджер с характером.',
    'Разрабатываю JARVIS — голосовой помощник.',
    'Превращаю идеи в приложения.',
  ];
  const lines = messages.map((message, index) => {
    const start = index * 6;
    const duration = 18;
    const keyTimes = `0;${((start + 0.01) / duration).toFixed(4)};${((start + 3) / duration).toFixed(4)};${((start + 5) / duration).toFixed(4)};${((start + 5.9) / duration).toFixed(4)};1`;
    return `<defs><clipPath id="line-${index}"><rect x="55" y="0" width="0" height="65">
      <animate attributeName="width" values="0;0;1080;1080;0;0" keyTimes="${keyTimes}" calcMode="linear" dur="18s" repeatCount="indefinite"/>
    </rect></clipPath></defs>
    <text x="55" y="40" class="mono" font-size="24" fill="#c2a6ff" clip-path="url(#line-${index})">&gt; ${escapeXml(message)}</text>`;
  }).join('\n');
  return svg(1200, 68, 'Создаю Aura. Разрабатываю JARVIS. Превращаю идеи в приложения.', lines);
}

function projectCard(project) {
  const aura = project === 'aura';
  const color = aura ? '#bc94ff' : '#8fceff';
  const name = aura ? 'Aura' : 'JARVIS';
  const subtitle = aura ? 'Общение в твоём ритме' : 'Твой голос. Его действия.';
  const tags = aura ? 'ANDROID  ·  WEB  ·  ЧАТЫ И ЗВОНКИ' : 'WINDOWS  ·  RUST  ·  TAURI';
  const description = aura ? 'Мессенджер с двумя стилями интерфейса.' : 'Голосовой помощник с локальным распознаванием.';
  const symbol = aura
    ? `<rect x="430" y="79" width="86" height="86" rx="24" fill="#8a63e9"/><circle cx="473" cy="122" r="21" stroke="#f3ebff" stroke-width="9" fill="none"/>`
    : `<circle cx="473" cy="122" r="49" fill="#142c44" stroke="#70c7ff"/><circle cx="473" cy="122" r="34" fill="none" stroke="#70c7ff" stroke-dasharray="11 5" stroke-width="3"/><path d="M 473 98 L 495 139 H 451 Z" fill="#a4e7ff"/>`;
  return svg(590, 310, `${name} — ${subtitle}`, `${panel(590, 310)}
    <ellipse cx="475" cy="120" rx="130" ry="125" fill="url(#aura)" opacity=".65"/>
    <text x="32" y="42" class="mono" font-size="11" letter-spacing="3" fill="${color}">${aura ? '01 / MESSENGER' : '02 / VOICE ASSISTANT'}</text>
    <text x="30" y="117" font-size="48" font-weight="750" fill="#f3efff">${name}</text>
    <text x="32" y="154" font-size="19" fill="${color}">${subtitle}</text>
    <text x="32" y="203" font-size="14" class="muted">${description}</text>
    <text x="32" y="236" class="mono" font-size="11" fill="#a8a5bc">${tags}</text>
    <path d="M 32 259 H 558" stroke="#35314d"/>
    <text x="32" y="286" font-size="13" fill="${color}">${aura ? 'Открыть сайт' : 'Исходный код и загрузка'} ↗</text>
    ${symbol}`);
}

function metrics(profile) {
  const calendar = profile.contributionsCollection.contributionCalendar;
  const repositories = profile.repositories.nodes.filter(repository => repository.name !== username);
  const days = calendar.weeks.flatMap(week => week.contributionDays);
  const activeDays = days.filter(day => day.contributionCount > 0).length;
  const stars = repositories.reduce((sum, repository) => sum + repository.stargazerCount, 0);
  const values = [
    [calendar.totalContributions, 'ДЕЙСТВИЙ ЗА ГОД'],
    [activeDays, 'ДНЕЙ С АКТИВНОСТЬЮ'],
    [repositories.length, 'ПУБЛИЧНЫХ ПРОЕКТОВ'],
    [stars, 'ЗВЁЗД ПРОЕКТОВ'],
  ];
  const cards = values.map(([value, label], index) => {
    const x = 34 + index * 292;
    return `<text x="${x}" y="85" font-size="49" font-weight="750" fill="${index === 0 ? '#d1b5ff' : '#e6e2f1'}">${value}</text>
      <text x="${x}" y="116" font-size="11" letter-spacing="1.4" class="muted">${label}</text>`;
  }).join('\n');
  const languages = new Map();
  for (const repository of repositories) {
    for (const edge of repository.languages.edges) {
      const previous = languages.get(edge.node.name);
      languages.set(edge.node.name, { name: edge.node.name, color: edge.node.color || '#a28be5', size: (previous?.size || 0) + edge.size });
    }
  }
  const topLanguages = [...languages.values()].sort((a, b) => b.size - a.size).slice(0, 4);
  const totalSize = topLanguages.reduce((sum, language) => sum + language.size, 0);
  let offset = 34;
  const bar = topLanguages.map(language => {
    const width = totalSize ? language.size / totalSize * 1132 : 0;
    const segment = `<rect x="${offset}" y="153" width="${width}" height="5" fill="${escapeXml(language.color)}"/>`;
    offset += width;
    return segment;
  }).join('\n');
  const legend = topLanguages.map((language, index) => `<circle cx="${40 + index * 225}" cy="191" r="4" fill="${escapeXml(language.color)}"/><text x="${52 + index * 225}" y="196" font-size="14" fill="#c4bfd7">${escapeXml(language.name)}</text>`).join('\n');
  return svg(1200, 226, 'Статистика реальной активности и языков публичных проектов', `${panel(1200, 226)}${cards}${bar}${legend}`);
}

function city(profile) {
  const calendar = profile.contributionsCollection.contributionCalendar;
  const columns = [];
  const maximum = Math.max(1, ...calendar.weeks.flatMap(week => week.contributionDays.map(day => day.contributionCount)));
  for (const [weekIndex, week] of calendar.weeks.entries()) {
    for (const day of week.contributionDays) {
      const x = 210 + weekIndex * 16 - day.weekday * 16;
      const y = 179 + weekIndex * 3.9 + day.weekday * 10;
      const height = day.contributionCount ? 18 + 125 * Math.sqrt(day.contributionCount / maximum) : 1;
      columns.push({ x, y, height, day });
    }
  }
  columns.sort((a, b) => a.y - b.y || a.x - b.x);
  const buildings = columns.map(({ x, y, height, day }) => {
    const top = y - height;
    const active = day.contributionCount > 0;
    const roof = active ? '#d4b1ff' : '#272640';
    const left = active ? '#7753c4' : '#171a2c';
    const right = active ? '#4b387f' : '#101422';
    return `<g><title>${day.date} · ${day.contributionCount}</title>
      <path d="M ${x} ${top} l 14 4 l -14 8 l -14 -4 Z" fill="${roof}" stroke="#3c3454" stroke-width=".5"/>
      <path d="M ${x - 14} ${top + 8} l 14 4 v ${height} l -14 -4 Z" fill="${left}"/>
      <path d="M ${x} ${top + 12} l 14 -8 v ${height} l -14 8 Z" fill="${right}"/>
      ${active ? `<path d="M ${x - 11} ${top + 11} l 8 2 m 4 -3 l 8 -4" stroke="#e6caff" stroke-width="1" opacity=".8"/>` : ''}
    </g>`;
  }).join('\n');
  return svg(1200, 532, 'Город активности — высота колонны соответствует числу действий за день', `${panel(1200, 532)}
    <ellipse cx="670" cy="340" rx="480" ry="160" fill="url(#aura)" opacity=".3"/>
    <text x="34" y="49" font-size="13" class="mono" letter-spacing="3" fill="#c4a5ff">ACTIVITY CITY</text>
    <text x="34" y="82" font-size="17" class="muted">Каждая колонна — день. Высота — число действий.</text>
    <path d="M 100 230 L 1050 464 L 1140 403" stroke="#5a3d84" opacity=".4" fill="none"/>
    ${buildings}
    <text x="34" y="493" font-size="12" class="muted">Последние 12 месяцев · данные GitHub</text>
    <text x="1166" y="493" text-anchor="end" font-size="12" fill="#be9eec">${calendar.totalContributions} действий</text>`);
}

const payload = await loadProfile();
if (payload.errors?.length || !payload.data?.user) throw new Error('GitHub did not return the requested profile');
const profile = payload.data.user;
await mkdir(outputDirectory, { recursive: true });
const images = {
  'banner.svg': banner(),
  'typing.svg': typing(),
  'aura.svg': projectCard('aura'),
  'jarvis.svg': projectCard('jarvis'),
  'metrics.svg': metrics(profile),
  'activity-city.svg': city(profile),
};
for (const [filename, content] of Object.entries(images)) {
  await writeFile(path.join(outputDirectory, filename), content);
}
console.log(`Generated ${Object.keys(images).length} profile assets from real GitHub data.`);
