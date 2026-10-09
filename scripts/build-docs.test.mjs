import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import config from '../docs.config.mjs';

test('handbook anchors, navigation before title, and validation failures', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const source = await mkdtemp(path.join(tmpdir(), 'uenv-docs-test-'));
  const output = path.join(root, `dist-test-${process.pid}`);
  const first = config.documents[0];
  const second = config.documents[1];
  const build = (check = true) => spawnSync(process.execPath, [
    path.join(root, 'scripts/build-docs.mjs'), '--source', source, '--output', output,
    ...(check ? ['--check'] : []),
  ], { cwd: root, encoding: 'utf8' });
  const writeFirst = (body) => writeFile(path.join(source, first.file), body);
  try {
    for (const doc of config.documents) {
      await mkdir(path.dirname(path.join(source, doc.file)), { recursive: true });
      await writeFile(path.join(source, doc.file), `# ${doc.title}\n`);
    }
    const link = path.relative(path.dirname(first.file), second.file).split(path.sep).join('/');
    await writeFile(path.join(source, second.file), `<a id="chapter-test"></a>\n# ${second.title}\n`);
    const valid = `[Next](${link}#chapter-test)\n\n<a id="intro"></a>\n# ${first.title}\n\n[Local](#intro)\n\n<script>alert(1)</script>\n\n<a id="bad" onclick="alert(1)"></a>\n\n\`\`\`html\n<a id="code-example"></a>\n\`\`\`\n`;
    await writeFirst(valid);
    let result = build(false);
    assert.equal(result.status, 0, result.stderr);
    const html = await readFile(path.join(output, 'docs/index.html'), 'utf8');
    const info = JSON.parse(await readFile(path.join(output, 'docs/build-info.json'), 'utf8'));
    assert.equal(info.source_directory, source);
    assert.equal(info.source_revision, null);
    assert.equal(info.source_dirty, null);
    assert.equal(info.inputs.length, config.documents.length);
    assert.equal(info.rendered_sha256, createHash('sha256').update(html).digest('hex'));
    assert.equal(info.inputs.find(input => input.path === first.file).sha256,
      createHash('sha256').update(valid).digest('hex'));
    assert.equal(info.content_sha256, createHash('sha256').update(JSON.stringify(info.inputs)).digest('hex'));
    assert.ok(Number.isFinite(Date.parse(info.generated_at)));
    assert.ok(html.includes(`id="${first.slug}--intro"`));
    assert.ok(html.includes(`?page=${second.slug}#${second.slug}--chapter-test`));
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(!html.includes('<a id="bad" onclick='));
    assert.ok(!html.includes(`id="${first.slug}--code-example"`));

    await writeFirst(valid.replace('[Local](#intro)', '[Local](#missing)'));
    result = build();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Broken heading link/);

    await writeFirst(valid + '\n<a id="intro"></a>\n');
    result = build();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /duplicate id/);

    await writeFirst(valid.replace(`# ${first.title}`, '## Wrong first heading'));
    result = build();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /H1 heading/);

    await writeFirst(valid.replace(`# ${first.title}`, '# Wrong title'));
    result = build();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /navigation title must equal/);
  } finally {
    await rm(source, { recursive: true, force: true });
    await rm(output, { recursive: true, force: true });
  }
});
