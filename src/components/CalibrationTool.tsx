'use client';

import { useState } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import type { ImageDims, Point } from '@/lib/roboflow';
import {
  MIN_REF_PX,
  fromCircle,
  fromLine,
  loadProfiles,
  saveProfile,
  isValidFor,
  type CalUnit,
  type Calibration,
  type CalProfiles,
} from '@/lib/calibration';

export type CalMode = 'line' | 'circle';

interface Props {
  dims: ImageDims;
  calibration: Calibration | null;
  onCalibration: (c: Calibration | null) => void;
  mode: CalMode | null;
  onMode: (m: CalMode | null) => void;
  points: Point[];
  onPoints: (p: Point[]) => void;
}

const chip =
  'cursor-pointer rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors';

export default function CalibrationTool({ dims, calibration, onCalibration, mode, onMode, points, onPoints }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<CalUnit>('mm');
  // Rendered only after a result exists (client-side), so reading localStorage here is safe.
  const [profiles, setProfiles] = useState<CalProfiles>(() => loadProfiles());
  const [profileName, setProfileName] = useState('');

  const needed = mode === 'circle' ? 3 : 2;
  const real = parseFloat(value.replace(',', '.'));
  const ready = !!mode && points.length === needed && real > 0;

  const apply = () => {
    if (!ready) return;
    const cal =
      mode === 'circle'
        ? fromCircle(points[0], points[1], points[2], real, unit, dims)
        : fromLine(points[0], points[1], real, unit, dims);
    if (cal) {
      onCalibration(cal);
      onMode(null);
      onPoints([]);
    }
  };

  const shortRef = calibration && calibration.refPx < MIN_REF_PX;

  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 p-5">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('cal.title')}</p>

      <div className="flex flex-wrap items-center gap-2">
        {(['line', 'circle'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              onPoints([]);
              onMode(mode === m ? null : m);
            }}
            className={`${chip} ${mode === m ? 'border-accent bg-accent/15 text-accent' : 'border-[var(--hairline)] text-ice-blue/70 hover:text-ice-white'}`}
          >
            {t(`cal.mode_${m}`)}
          </button>
        ))}
        {calibration && (
          <button onClick={() => onCalibration(null)} className={`${chip} border-[var(--hairline)] text-ice-blue/50 hover:text-ice-white`}>
            {t('cal.clear')}
          </button>
        )}
      </div>

      {mode && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-ice-blue/70">
            {t(mode === 'circle' ? 'cal.hint_circle' : 'cal.hint_line')} ({points.length}/{needed})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t(mode === 'circle' ? 'cal.diameter' : 'cal.length')}
              className="w-36 rounded-md border border-[var(--hairline)] bg-ocean-night/60 px-3 py-1.5 font-mono text-sm text-ice-white outline-none focus:border-accent"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as CalUnit)}
              className="rounded-md border border-[var(--hairline)] bg-ocean-night/60 px-2 py-1.5 font-mono text-sm text-ice-white outline-none"
            >
              <option value="mm">mm</option>
              <option value="µm">µm</option>
            </select>
            <button
              onClick={apply}
              disabled={!ready}
              className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-ocean-night disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('cal.apply')}
            </button>
            <button onClick={() => onPoints([])} className={`${chip} border-[var(--hairline)] text-ice-blue/60`}>
              {t('cal.reset_points')}
            </button>
          </div>
        </div>
      )}

      {calibration && (
        <div className="mt-4 font-mono text-xs text-ice-blue/80">
          <p>
            k = {calibration.k.toPrecision(5)} {calibration.unit}/px · ±{(calibration.relUncertainty * 100).toFixed(2)} %
          </p>
          {shortRef && <p className="mt-1 text-[#f0a83c]">{t('cal.warn_short')}</p>}
        </div>
      )}
      {!calibration && !mode && <p className="mt-3 text-xs text-ice-blue/45">{t('cal.none')}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--hairline)] pt-3">
        <input
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder={t('cal.profile_name')}
          className="w-40 rounded-md border border-[var(--hairline)] bg-ocean-night/60 px-3 py-1.5 font-mono text-xs text-ice-white outline-none focus:border-accent"
        />
        <button
          disabled={!calibration || !profileName.trim()}
          onClick={() => {
            if (!calibration) return;
            saveProfile(profileName.trim(), calibration);
            setProfiles(loadProfiles());
          }}
          className={`${chip} border-[var(--hairline)] text-ice-blue/70 disabled:opacity-40`}
        >
          {t('cal.save')}
        </button>
        {Object.entries(profiles).map(([name, p]) => {
          const ok = isValidFor(p, dims);
          return (
            <button
              key={name}
              disabled={!ok}
              title={ok ? undefined : t('cal.profile_mismatch')}
              onClick={() => onCalibration(p)}
              className={`${chip} border-[var(--hairline)] text-ice-blue/70 disabled:opacity-35`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
