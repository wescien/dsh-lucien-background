import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Schema from '@deepseek-ai/schemastery';

/**
 * Host half of the cosmic background bundle.
 *
 * Two jobs:
 * 1. Declare a Config so the Plugins page treats this bundle as configurable and
 *    renders the Client panel (`plugins.bundle.config`) on its own page.
 * 2. Receive the in-page self-test report and persist it next to the profile, so
 *    a failure is observable from outside the browser instead of guessed at.
 */

export const Config = Schema.object({
  panel: Schema.boolean()
    .default(true)
    .description('在插件页显示「宇宙无敌背景」控制面板（关闭后仍可从 设置 → 宇宙无敌背景 进入）'),
});

const REPORT_NAME = 'cosmic-background-report.json';
const LOG_NAME = 'cosmic-background-report.log';
const REPORT_LOG = 'cosmic-background-report.jsonl';

function reportDir() {
  /* The profile directory is where the Loader runs this plugin from; it is
     also the directory a human (or an agent) can read back. */
  return process.env.DSH_PROFILE_DIR || process.env.DSH_HOME || process.cwd();
}

async function readBody(req, limit = 256 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('too-large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

export const inject = ['webServer'];

export function apply(ctx) {
  const dir = reportDir();

  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: '/cosmic/report',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'method' });
          return;
        }

        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch (error) {
          sendJson(res, error && error.status === 413 ? 413 : 400, { error: 'bad-body' });
          return;
        }

        const record = {
          receivedAt: new Date().toISOString(),
          ...(payload && typeof payload === 'object' ? payload : {}),
        };

        try {
          await mkdir(dir, { recursive: true });
          await writeFile(path.join(dir, REPORT_NAME), JSON.stringify(record, null, 2), 'utf8');
          /* Every payload also lands in an append-only log, so a later probe does
             not overwrite an earlier one (boot / ui / self-test all matter). */
          await appendFile(path.join(dir, REPORT_LOG), `${JSON.stringify(record)}\n`).catch(() => {});
          const failed = Array.isArray(record.checks) ? record.checks.filter((check) => !check.ok) : [];
          if (failed.length > 0) {
            await appendFile(
              path.join(dir, LOG_NAME),
              `${record.receivedAt} FAILED ${failed.map((check) => check.name).join(', ')}\n`,
            ).catch(() => {});
          }
          sendJson(res, 200, { ok: true, file: path.join(dir, REPORT_NAME), failed: failed.length });
        } catch (error) {
          sendJson(res, 500, { error: 'write', detail: error instanceof Error ? error.message : String(error) });
        }
      },
    }),
    'cosmic background: self-test report route',
  );
}
