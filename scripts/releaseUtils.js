/**
 * modified from https://github.com/vuejs/core/blob/master/scripts/release.js
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import colors from 'picocolors';
import { execa } from 'execa';
import semver from 'semver';
import fs from 'fs-extra';
import minimist from 'minimist';

export const args = minimist(process.argv.slice(2));

export const isDryRun = !!args.dry;

if (isDryRun) {
  console.log(colors.inverse(colors.yellow(' DRY RUN ')));
  console.log();
}

export const packages = ['vite', 'create-vite', 'plugin-legacy', 'plugin-react', 'plugin-vue', 'plugin-vue-jsx'];

export const versionIncrements = [
  'patch',
  'minor',
  'major',
  // 'prepatch',
  // 'preminor',
  // 'premajor',
  // 'prerelease'
];

export function getPackageInfo(pkgName) {
  const pkgDir = path.resolve(__dirname, '../packages/' + pkgName);

  if (!existsSync(pkgDir)) {
    throw new Error(`Package ${pkgName} not found`);
  }

  const pkgPath = path.resolve(pkgDir, 'package.json');
  const pkg = require(pkgPath);
  const currentVersion = pkg.version;

  if (pkg.private) {
    throw new Error(`Package ${pkgName} is private`);
  }

  return {
    pkg,
    pkgName,
    pkgDir,
    pkgPath,
    currentVersion,
  };
}

export async function run(bin, args, opts = {}) {
  return execa(bin, args, { stdio: 'inherit', ...opts });
}

export async function dryRun(bin, args, opts) {
  return console.log(colors.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts || '');
}

export const runIfNotDry = isDryRun ? dryRun : run;

export function step(msg) {
  return console.log(colors.cyan(msg));
}

export function getVersionChoices(currentVersion) {
  const currentBeta = currentVersion.includes('beta');
  const currentAlpha = currentVersion.includes('alpha');
  const isStable = !currentBeta && !currentAlpha;

  function inc(i, tag = currentAlpha ? 'alpha' : 'beta') {
    return semver.inc(currentVersion, i, tag);
  }

  let versionChoices = [
    {
      title: 'next',
      value: inc(isStable ? 'patch' : 'prerelease'),
    },
  ];

  if (isStable) {
    versionChoices.push(
      {
        title: 'beta-minor',
        value: inc('preminor'),
      },
      {
        title: 'beta-major',
        value: inc('premajor'),
      },
      {
        title: 'alpha-minor',
        value: inc('preminor', 'alpha'),
      },
      {
        title: 'alpha-major',
        value: inc('premajor', 'alpha'),
      },
      {
        title: 'minor',
        value: inc('minor'),
      },
      {
        title: 'major',
        value: inc('major'),
      }
    );
  } else if (currentAlpha) {
    versionChoices.push({
      title: 'beta',
      value: inc('patch') + '-beta.0',
    });
  } else {
    versionChoices.push({
      title: 'stable',
      value: inc('patch'),
    });
  }
  versionChoices.push({ value: 'custom', title: 'custom' });

  versionChoices = versionChoices.map((i) => {
    i.title = `${i.title} (${i.value})`;
    return i;
  });

  return versionChoices;
}

export function updateVersion(pkgPath, version) {
  const pkg = fs.readJSONSync(pkgPath);
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

export async function publishPackage(pkdDir, tag) {
  const publicArgs = ['publish', '--access', 'public'];
  if (tag) {
    publicArgs.push(`--tag`, tag);
  }
  await runIfNotDry('npm', publicArgs, {
    cwd: pkdDir,
  });
}

export async function getLatestTag(pkgName) {
  const tags = (await run('git', ['tag'], { stdio: 'pipe' })).stdout.split(/\n/).filter(Boolean);
  const prefix = pkgName === 'vite' ? 'v' : `${pkgName}@`;
  return tags
    .filter((tag) => tag.startsWith(prefix))
    .sort()
    .reverse()[0];
}

export async function logRecentCommits(pkgName) {
  const tag = await getLatestTag(pkgName);
  if (!tag) return;
  const sha = await run('git', ['rev-list', '-n', '1', tag], {
    stdio: 'pipe',
  }).then((res) => res.stdout.trim());
  console.log(
    colors.bold(
      `\n${colors.blue(`i`)} Commits of ${colors.green(pkgName)} since ${colors.green(tag)} ${colors.gray(`(${sha.slice(0, 5)})`)}`
    )
  );
  await run('git', ['--no-pager', 'log', `${sha}..HEAD`, '--oneline', '--', `packages/${pkgName}`], { stdio: 'inherit' });
  console.log();
}

export async function updateTemplateVersions() {
  const viteVersion = (await fs.readJSON(path.resolve(__dirname, '../packages/vite/package.json'))).version;
  if (/beta|alpha|rc/.test(viteVersion)) return;

  const dir = path.resolve(__dirname, '../packages/create-vite');

  const templates = readdirSync(dir).filter((dir) => dir.startsWith('template-'));
  for (const template of templates) {
    const pkgPath = path.join(dir, template, `package.json`);
    const pkg = require(pkgPath);
    pkg.devDependencies.vite = `^` + viteVersion;
    if (template.startsWith('template-vue')) {
      pkg.devDependencies['@vitejs/plugin-vue'] =
        `^` + (await fs.readJSON(path.resolve(__dirname, '../packages/plugin-vue/package.json'))).version;
    }
    if (template.startsWith('template-react')) {
      pkg.devDependencies['@vitejs/plugin-react'] =
        `^` + (await fs.readJSON(path.resolve(__dirname, '../packages/plugin-react/package.json'))).version;
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}
