import { readFile, writeFile } from 'node:fs/promises';

const username = '120spartacus120-hash';
const languages = [
  { name: 'Kotlin', color: '7F52FF', logo: 'kotlin' },
  { name: 'JavaScript', color: 'F7DF1E', logo: 'javascript', logoColor: 'black' },
  { name: 'TypeScript', color: '3178C6', logo: 'typescript' },
  { name: 'Rust', color: '000000', logo: 'rust' },
  { name: 'Svelte', color: 'FF3E00', logo: 'svelte' },
  { name: 'Python', color: '3776AB', logo: 'python' },
];

async function github(endpoint) {
  const response = await fetch(`https://api.github.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'profile-language-counts',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} for ${endpoint}`);
  return response.json();
}

if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN is required');
const counts = Object.fromEntries(languages.map(language => [language.name, 0]));
let page = 1;
let repositories;
do {
  repositories = await github(`users/${username}/repos?type=owner&per_page=100&page=${page}`);
  for (const repository of repositories) {
    if (repository.private || repository.fork || repository.name === username) continue;
    const repositoryLanguages = await github(`repos/${username}/${encodeURIComponent(repository.name)}/languages`);
    for (const language of languages) {
      if (repositoryLanguages[language.name] > 0) counts[language.name] += 1;
    }
  }
  page += 1;
} while (repositories.length === 100);

const badges = languages.map(language => {
  const count = counts[language.name];
  const label = `${count} ${count === 1 ? 'repo' : 'repos'}`;
  const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(language.name)}-${encodeURIComponent(label)}-${language.color}?logo=${language.logo}&logoColor=${language.logoColor || 'white'}`;
  return `![${language.name}: ${label}](${badgeUrl})`;
}).join('\n');

const readme = await readFile('README.md', 'utf8');
const marker = /<!-- language-counts:start -->[\s\S]*?<!-- language-counts:end -->/;
if (!marker.test(readme)) throw new Error('The language count markers are missing from README.md');
const updated = readme.replace(marker, `<!-- language-counts:start -->\n${badges}\n<!-- language-counts:end -->`);
if (readme !== updated) await writeFile('README.md', updated);
console.log(JSON.stringify(counts));
