'use client';

import { useI18n } from '@/components/LanguageProvider';
import {
  buildAnalysisRecord,
  downloadBlob,
  sha256Hex,
  toCSV,
  type RecordInput,
} from '@/lib/export';

interface Props {
  /** Builds everything except the file hash (computed on click). */
  getInput: () => Omit<RecordInput, 'file'> & { file: Omit<RecordInput['file'], 'sha256'>; blob: Blob };
  disabled?: boolean;
}

export default function ExportButton({ getInput, disabled }: Props) {
  const { t } = useI18n();

  const run = async (kind: 'json' | 'csv') => {
    const { blob, file, ...rest } = getInput();
    const sha256 = await sha256Hex(blob);
    const rec = buildAnalysisRecord({ ...rest, file: { ...file, sha256 } });
    const stem = `partikel_${rec.analysis_id.slice(0, 8)}`;
    if (kind === 'json') {
      downloadBlob(`${stem}.json`, new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' }));
    } else {
      downloadBlob(`${stem}.csv`, new Blob([toCSV(rec)], { type: 'text/csv;charset=utf-8' }));
    }
  };

  const cls =
    'cursor-pointer rounded-full border border-[var(--hairline)] px-4 py-2 text-sm font-medium text-ice-blue transition-colors hover:border-ice-blue/50 hover:text-ice-white disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('export.title')}</span>
      <button disabled={disabled} onClick={() => run('json')} className={cls}>
        JSON
      </button>
      <button disabled={disabled} onClick={() => run('csv')} className={cls}>
        CSV
      </button>
    </div>
  );
}
