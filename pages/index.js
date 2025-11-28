import { useMemo, useState, useEffect } from 'react';

const DEFAULT_LAP_METERS = 400;
const METERS_IN_KM = 1000;
const TRACK_PATH =
  'M110 10H190Q210 10 210 35V85Q210 110 190 110H30Q10 110 10 85V35Q10 10 30 10Z';
const TRACK_LANE_PATH =
  'M110 22H180Q196 22 196 38V82Q196 98 180 98H40Q24 98 24 82V38Q24 22 40 22Z';
const TRACK_INFIELD_PATH =
  'M110 30H170Q188 30 188 48V72Q188 90 170 90H50Q32 90 32 72V48Q32 30 50 30Z';

const padTime = (value) => String(value).padStart(2, '0');

const parseDurationInput = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed) * 60;
  }

  const segments = trimmed.split(':').map((part) => Number(part));
  if (segments.some((segment) => Number.isNaN(segment))) {
    return null;
  }

  if (segments.length === 3) {
    const [hours, minutes, seconds] = segments;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (segments.length === 2) {
    const [minutes, seconds] = segments;
    return minutes * 60 + seconds;
  }

  return Number.isFinite(Number(trimmed)) ? Number(trimmed) : null;
};

const formatDuration = (seconds) => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) {
    return `${hours}:${padTime(minutes)}:${padTime(secs)}`;
  }

  return `${minutes}:${padTime(secs)}`;
};

const formatPace = (secondsPerKm) => {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return null;
  }
  const rounded = Math.round(secondsPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${padTime(seconds)} min/km`;
};

const formatMeters = (value) => {
  if (!value && value !== 0) return '—';
  return `${value.toLocaleString('pt-BR')} m`;
};

const buildRoundedTrackPath = ({ x, y, width, height, rx }) => {
  const cx = x + width / 2;
  const right = x + width;
  const bottom = y + height;
  const leftCurveStart = x + rx;
  const leftCurveEnd = x + rx;
  const rightCurveStart = right - rx;
  const rightCurveEnd = right - rx;
  const ry = rx;
  return `M${cx} ${y} H${leftCurveStart} A${rx} ${ry} 0 0 0 ${leftCurveEnd} ${bottom} H${rightCurveStart} A${rx} ${ry} 0 0 0 ${rightCurveEnd} ${y} H${cx}`;
};

const RUNNER_LANE_OFFSET = 91;
const RUNNER_PATH_BOUNDS = {
  x: 74 + RUNNER_LANE_OFFSET,
  y: 54 + RUNNER_LANE_OFFSET,
  width: 852 - RUNNER_LANE_OFFSET * 2,
  height: 492 - RUNNER_LANE_OFFSET * 2,
  rx: 246 - RUNNER_LANE_OFFSET,
};

const TRACK_PROGRESS_PATH = buildRoundedTrackPath(RUNNER_PATH_BOUNDS);

const TrackVisual = ({ lapData, lapLength }) => {
  const progress =
    lapData && lapData.progress === 0 && lapData.lapCount > 0
      ? 1
      : (lapData?.progress ?? 0);
  const lapLayers = lapData ? Math.min(lapData.fullLaps, 6) : 0;

  return (
    <div className="track-visual">
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Visual da pista de atletismo"
      >
        <defs>
          <mask id="trackMask">
            <rect width="1000" height="600" fill="white" />
            <rect
              x="172"
              y="152"
              width="656"
              height="296"
              rx="148"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="120"
          y="90"
          width="760"
          height="420"
          rx="190"
          className="track-grass"
        />
        <g mask="url(#trackMask)">
          <rect
            x="60"
            y="40"
            width="880"
            height="520"
            rx="260"
            className="track-fill"
          />
        </g>
        <rect
          x="60"
          y="40"
          width="880"
          height="520"
          rx="260"
          className="track-border"
        />
        <rect
          x="172"
          y="152"
          width="656"
          height="296"
          rx="148"
          className="track-border"
        />
        <g className="track-lane-group">
          {[0, 14, 28, 42, 56, 70, 84].map((offset) => (
            <rect
              key={`lane-${offset}`}
              x={74 + offset}
              y={54 + offset}
              width={852 - offset * 2}
              height={492 - offset * 2}
              rx={246 - offset}
              className="track-lane-line"
            />
          ))}
        </g>
        {Array.from({ length: lapLayers }).map((_, index) => (
          <path
            key={`lap-layer-${index}`}
            pathLength="1"
            className="track-complete"
            d={TRACK_PROGRESS_PATH}
            style={{ opacity: Math.max(0.2, 0.65 - index * 0.1) }}
          />
        ))}
        {progress > 0 && (
          <path
            pathLength="1"
            className="track-progress"
            d={TRACK_PROGRESS_PATH}
            style={{
              strokeDasharray: `${progress} ${1 - progress}`,
              strokeDashoffset: 0,
            }}
          />
        )}
      </svg>
      <div className="track-details">
        {lapData ? (
          <>
            <p className="track-count">
              <strong>{lapData.lapCount.toFixed(2)}</strong> voltas no total
            </p>
            <p className="track-extra">
              {lapData.fullLaps} voltas completas e {lapData.remainderMeters} m
              restantes
            </p>
          </>
        ) : (
          <p className="track-placeholder">
            Informe uma distância para ver quantas voltas ela representa.
          </p>
        )}
      </div>
      {lapData?.fullLaps > 0 && (
        <div className="lap-markers">
          {Array.from({
            length: Math.min(lapData.fullLaps, 8),
          }).map((_, index) => (
            <span key={`lap-marker-${index}`}>{index + 1}</span>
          ))}
          {lapData.fullLaps > 8 && (
            <span className="lap-marker-extra">+{lapData.fullLaps - 8}</span>
          )}
        </div>
      )}
    </div>
  );
};

const LapSplits = ({ splits, lapLength }) => {
  if (!splits.length) return null;
  const lapLabel = lapLength.toLocaleString('pt-BR');
  return (
    <div className="splits">
      <h3>Parciais ({lapLabel} m)</h3>
      <ul>
        {splits.map((split) => (
          <li key={split.id}>
            <span>
              {split.label} {split.isFinal ? '(final)' : ''}
            </span>
            <span>{split.time ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const formatTimer = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${padTime(minutes)}:${padTime(seconds)}.${padTime(centiseconds)}`;
};

const TimerGroup = ({ id, onRemove }) => {
  const [name, setName] = useState(`Grupo ${id}`);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mode, setMode] = useState('idle'); // 'idle' | 'run' | 'rest'
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let interval;
    if (mode !== 'idle' && startTime) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 30);
    }
    return () => clearInterval(interval);
  }, [mode, startTime]);

  useEffect(() => {
    const handleGlobalStart = () => {
      if (mode === 'idle') {
        handleStart();
      }
    };
    window.addEventListener('start-all-timers', handleGlobalStart);
    return () => {
      window.removeEventListener('start-all-timers', handleGlobalStart);
    };
  }, [mode]); // Re-bind when mode changes to ensure handleStart has correct closure if needed

  const handleStart = () => {
    setMode('run');
    setStartTime(Date.now());
    setElapsed(0);
  };

  const handleLap = () => {
    if (mode === 'idle') return;
    const duration = Date.now() - startTime;
    const newEntry = {
      mode,
      duration,
      timestamp: Date.now(),
      id: Date.now() + Math.random(),
    };
    // Append new entry to the end
    setHistory((prev) => [...prev, newEntry]);

    // Toggle mode
    const nextMode = mode === 'run' ? 'rest' : 'run';
    setMode(nextMode);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const handleStop = () => {
    if (mode !== 'idle') {
      const duration = Date.now() - startTime;
      const newEntry = {
        mode,
        duration,
        timestamp: Date.now(),
        id: Date.now() + Math.random(),
      };
      setHistory((prev) => [...prev, newEntry]);
    }
    setMode('idle');
    setStartTime(null);
    setElapsed(0);
  };

  const handleReset = () => {
    setMode('idle');
    setStartTime(null);
    setElapsed(0);
    setHistory([]);
  };

  // Process history into pairs (run + rest)
  const historyRows = useMemo(() => {
    const rows = [];
    let currentRun = null;

    history.forEach((entry) => {
      if (entry.mode === 'run') {
        currentRun = { run: entry, rest: null };
        rows.push(currentRun);
      } else if (entry.mode === 'rest' && currentRun) {
        currentRun.rest = entry;
        currentRun = null; // Reset current run after pairing
      } else if (entry.mode === 'rest' && !currentRun) {
        // Standalone rest (shouldn't happen in normal flow but handle just in case)
        rows.push({ run: null, rest: entry });
      }
    });
    return rows;
  }, [history]);

  return (
    <article className="card compact timer-group">
      <div className="card-header timer-header">
        {isEditingName ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingName(false);
            }}
            autoFocus
            className="timer-name-input"
          />
        ) : (
          <h3 onClick={() => setIsEditingName(true)} title="Clique para renomear">
            {name}
          </h3>
        )}
        <button
          onClick={() => onRemove(id)}
          className="timer-remove"
          aria-label="Remover grupo"
          title="Remover"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div className="timer-display">
        <span className={`timer-value ${mode === 'rest' ? 'text-rest' : ''}`}>
          {formatTimer(elapsed)}
        </span>
        <span className="timer-label">
          {mode === 'idle'
            ? 'Pronto'
            : mode === 'run'
              ? 'Correndo'
              : 'Descanso'}
        </span>
      </div>

      <div className="timer-controls">
        {mode === 'idle' ? (
          <button 
            className="btn-primary btn-icon btn-run" 
            onClick={handleStart}
            title="Iniciar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
            </svg>
          </button>
        ) : (
          <>
            <button 
              className={`btn-icon ${mode === 'run' ? 'btn-rest' : 'btn-run'}`}
              onClick={handleLap}
              title={mode === 'run' ? 'Descansar' : 'Correr'}
            >
              {mode === 'run' ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
                  <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
                </svg>
              )}
            </button>
            <button 
              className="btn-secondary btn-icon" 
              onClick={handleStop}
              title="Parar"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </>
        )}
        {mode === 'idle' && history.length > 0 && (
          <button 
            className="btn-secondary btn-icon" 
            onClick={handleReset}
            title="Limpar"
          >
            ↺
          </button>
        )}
        {history.length > 0 && (
          <button
            className="btn-secondary btn-icon"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            title={
              isHistoryOpen
                ? 'Ocultar Histórico'
                : `Ver Histórico (${historyRows.length})`
            }
            style={isHistoryOpen ? { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' } : {}}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {history.length > 0 && isHistoryOpen && (
        <div className="timer-history-section">
          <div className="timer-history-table">
            <div className="history-header">
              <span>#</span>
              <span>Corrida</span>
              <span>Descanso</span>
            </div>
            <div className="history-body">
              {historyRows.map((row, index) => (
                <div key={index} className="history-row">
                  <span className="history-idx">{index + 1}</span>
                  <span className="history-run">
                    {row.run ? formatTimer(row.run.duration) : '—'}
                  </span>
                  <span className="history-rest">
                    {row.rest ? formatTimer(row.rest.duration) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const TimerManager = () => {
  const [groups, setGroups] = useState([{ id: 1 }]);
  const [showHelp, setShowHelp] = useState(false);

  const addGroup = () => {
    const newId =
      groups.length > 0 ? Math.max(...groups.map((g) => g.id)) + 1 : 1;
    setGroups([...groups, { id: newId }]);
  };

  const removeGroup = (id) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const startAll = () => {
    // Dispatch a custom event that TimerGroup components listen for
    const event = new CustomEvent('start-all-timers');
    window.dispatchEvent(event);
  };

  return (
    <div className="timer-section-wrapper">
      <div className="section-header-main" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2>Cronômetros</h2>
          <button
            className={`help-toggle ${showHelp ? 'active' : ''}`}
            onClick={() => setShowHelp(!showHelp)}
            title="Como usar"
          >
            ?
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={startAll} className="settings-toggle">
          ▶ Iniciar Todos
        </button>
        <button onClick={addGroup} className="settings-toggle">
          + Novo Grupo
        </button>
      </div>

      {showHelp && (
        <div className="timer-help-card">
          <h4>Como usar os cronômetros:</h4>
          <ul>
            <li>
              <strong>Iniciar (▶):</strong> Começa a contar o tempo de corrida
              (Azul).
            </li>
            <li>
              <strong>Lap (⏸):</strong> Registra a parcial e muda para descanso
              (Rosa).
            </li>
            <li>
              <strong>Lap (▶):</strong> Registra o descanso e inicia nova
              corrida (Azul).
            </li>
            <li>
              <strong>Renomear:</strong> Clique no nome "Grupo X" para editar.
            </li>
            <li>
              <strong>Todos (▶):</strong> Inicia todos os cronômetros parados.
            </li>
          </ul>
        </div>
      )}

      <div className="timer-grid">
        {groups.map((group) => (
          <TimerGroup key={group.id} id={group.id} onRemove={removeGroup} />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const [distance, setDistance] = useState('');
  const [time, setTime] = useState('');
  const [pace, setPace] = useState('');
  const [lapLength, setLapLength] = useState(DEFAULT_LAP_METERS);
  const [lapLengthInput, setLapLengthInput] = useState(
    String(DEFAULT_LAP_METERS)
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const distanceValue =
    distance.trim() === '' ? null : Number.parseFloat(distance);
  const hasDistance =
    typeof distanceValue === 'number' &&
    !Number.isNaN(distanceValue) &&
    distanceValue > 0;

  const lapLengthSafe = lapLength > 0 ? lapLength : DEFAULT_LAP_METERS;

  const distanceKm = hasDistance ? distanceValue / METERS_IN_KM : null;
  const timeSeconds = parseDurationInput(time);
  const paceSeconds = parseDurationInput(pace);
  const hasTime = Boolean(timeSeconds);
  const hasPace = Boolean(paceSeconds);

  const handleLapLengthInput = (event) => {
    const nextValue = event.target.value;
    setLapLengthInput(nextValue);
    const parsed = Number(nextValue);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setLapLength(parsed);
    }
  };

  const handleResetLapLength = () => {
    setLapLength(DEFAULT_LAP_METERS);
    setLapLengthInput(String(DEFAULT_LAP_METERS));
  };

  const lapLengthLabel = `${lapLengthSafe.toLocaleString('pt-BR')} m`;

  const paceResult = useMemo(() => {
    if (!distanceKm || !timeSeconds) return null;
    return formatPace(timeSeconds / distanceKm);
  }, [distanceKm, timeSeconds]);

  const timeResult = useMemo(() => {
    if (!distanceKm || !paceSeconds) return null;
    return formatDuration(paceSeconds * distanceKm);
  }, [distanceKm, paceSeconds]);

  const distanceResult = useMemo(() => {
    if (!timeSeconds || !paceSeconds) return null;
    const kilometers = timeSeconds / paceSeconds;
    if (!Number.isFinite(kilometers) || kilometers <= 0) return null;
    const meters = kilometers * METERS_IN_KM;
    return `${meters.toFixed(0)} m (${kilometers.toFixed(2)} km)`;
  }, [timeSeconds, paceSeconds]);

  const highlightedField = useMemo(() => {
    const providedCount = [hasDistance, hasTime, hasPace].filter(
      Boolean
    ).length;
    if (providedCount !== 2) return null;
    if (!hasDistance) return 'distance';
    if (!hasTime) return 'time';
    if (!hasPace) return 'pace';
    return null;
  }, [hasDistance, hasTime, hasPace]);

  const distanceIsCalculated = !hasDistance && Boolean(distanceResult);
  const timeIsCalculated = !hasTime && Boolean(timeResult);
  const paceIsCalculated = !hasPace && Boolean(paceResult);

  const distanceDisplay = hasDistance
    ? formatMeters(distanceValue)
    : (distanceResult ?? '—');
  const timeDisplay = time || timeResult || '—';
  const paceDisplay = pace || paceResult || '—';

  const lapData = useMemo(() => {
    if (!hasDistance) return null;
    const totalMeters = distanceValue;
    const lapCount = totalMeters / lapLengthSafe;
    const fullLaps = Math.floor(lapCount);
    const remainderMeters = Math.round(totalMeters - fullLaps * lapLengthSafe);
    const progress = lapCount === 0 ? 0 : lapCount % 1;
    return {
      lapCount,
      fullLaps,
      remainderMeters,
      progress,
    };
  }, [hasDistance, distanceValue, lapLengthSafe]);

  const lapSplits = useMemo(() => {
    if (!hasDistance) return [];
    const totalMeters = distanceValue;
    if (totalMeters <= lapLengthSafe) return [];

    const splits = [];
    const fullLaps = Math.floor(totalMeters / lapLengthSafe);

    for (let lap = 1; lap <= fullLaps; lap += 1) {
      const cumulativeMeters = lap * lapLengthSafe;
      let splitTime = null;
      if (paceSeconds) {
        splitTime = formatDuration(
          paceSeconds * (cumulativeMeters / METERS_IN_KM)
        );
      } else if (timeSeconds && totalMeters > 0) {
        const ratio = cumulativeMeters / totalMeters;
        splitTime = formatDuration(timeSeconds * ratio);
      }
      splits.push({
        id: `lap-${lap}`,
        label: `${lap}ª volta — ${cumulativeMeters} m`,
        time: splitTime,
      });
    }

    const remainder = totalMeters % lapLengthSafe;
    if (remainder > 0) {
      const cumulativeMeters = totalMeters;
      let splitTime = null;
      if (paceSeconds) {
        splitTime = formatDuration(
          paceSeconds * (cumulativeMeters / METERS_IN_KM)
        );
      } else if (timeSeconds) {
        splitTime = formatDuration(timeSeconds);
      }
      splits.push({
        id: 'lap-final',
        label: `${fullLaps + 1}ª volta — ${cumulativeMeters} m`,
        time: splitTime,
        isFinal: true,
        lap: fullLaps + 1,
        cumulativeMeters,
      });
    }

    return splits;
  }, [hasDistance, distanceValue, paceSeconds, timeSeconds, lapLengthSafe]);

  return (
    <main>
      <header className="hero">
        <h1>Calculadora de Pista</h1>
        <p className="subtitle">
          Treine com precisão: calcule seu pace, tempo ou distância e visualize
          suas voltas na pista.
        </p>
      </header>

      <div className="feature-section calculator-section">
        <div className="section-header-main">
          <h2>Calculadora de Ritmo</h2>
        </div>
        <section className="dashboard">
          <article className="card compact">
            <div className="card-header">
              <h2>Parâmetros do treino</h2>
              <p>Preencha dois campos e nós calculamos o terceiro.</p>
            </div>

            <div className="form-grid">
              <label>
                <span>
                  Distância <span className="unit">(m)</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1000"
                  value={distance}
                  onChange={(event) => setDistance(event.target.value)}
                />
              </label>

              <label>
                <span>
                  Tempo total <span className="unit">(hh:mm:ss)</span>
                </span>
                <input
                  type="text"
                  placeholder="00:45:00"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </label>

              <label>
                <span>
                  Pace <span className="unit">(mm:ss / km)</span>
                </span>
                <input
                  type="text"
                  placeholder="04:30"
                  value={pace}
                  onChange={(event) => setPace(event.target.value)}
                />
              </label>
            </div>
          </article>

          <article className="card compact">
            <div className="card-header">
              <h2>Resultados</h2>
            </div>

            <div className="results-grid single">
              <div
                className={`result-tile ${
                  highlightedField === 'distance' ? 'focus' : ''
                }`}
              >
                <p className="result-label">Distância</p>
                <p className="result-value">{distanceDisplay}</p>
                <p className="result-detail">
                  {distanceIsCalculated
                    ? 'Calculado'
                    : hasDistance
                      ? 'Informado'
                      : '—'}
                </p>
              </div>
              <div
                className={`result-tile ${
                  highlightedField === 'time' ? 'focus' : ''
                }`}
              >
                <p className="result-label">Tempo</p>
                <p className="result-value">{timeDisplay}</p>
                <p className="result-detail">
                  {timeIsCalculated ? 'Calculado' : hasTime ? 'Informado' : '—'}
                </p>
              </div>
              <div
                className={`result-tile ${
                  highlightedField === 'pace' ? 'focus' : ''
                }`}
              >
                <p className="result-label">Pace</p>
                <p className="result-value">{paceDisplay}</p>
                <p className="result-detail">
                  {paceIsCalculated ? 'Calculado' : hasPace ? 'Informado' : '—'}
                </p>
              </div>
            </div>

            <LapSplits splits={lapSplits} lapLength={lapLengthSafe} />
          </article>

          <article className="card track">
            <div className="card-header track-header">
              <div>
                <h2>Visual da pista</h2>
                <p>Cada volta representa {lapLengthLabel}.</p>
              </div>
              <button
                type="button"
                className="settings-toggle"
                onClick={() => setIsConfigOpen((prev) => !prev)}
              >
                {isConfigOpen ? 'Pronto' : 'Ajustar'}
              </button>
            </div>
            {isConfigOpen && (
              <div className="track-config">
                <label>
                  Comprimento da volta (m)
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={lapLengthInput}
                    onChange={handleLapLengthInput}
                  />
                </label>
                <button
                  type="button"
                  className="settings-toggle ghost"
                  onClick={handleResetLapLength}
                >
                  Redefinir para 400 m
                </button>
              </div>
            )}
            <TrackVisual lapData={lapData} lapLength={lapLengthSafe} />
          </article>
        </section>
      </div>

      <div className="feature-divider"></div>

      <div className="feature-section timers-section">
        <TimerManager />
      </div>
    </main>
  );
}
