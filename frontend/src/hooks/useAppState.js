import { useState, useEffect, useMemo } from 'react';

export function useAppState() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sources, setSources] = useState([]);
  const [defaultDest, setDefaultDest] = useState('');
  const [rules, setRules] = useState([]);
  const [customPresets, setCustomPresets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [startMinimized, setStartMinimized] = useState(false);

  useEffect(() => {
    if (window.api) {
      window.api.getState().then(state => {
        setIsMonitoring(state.isMonitoring);
        setSources(state.sources || []);
        setDefaultDest(state.defaultDest || '');
        setRules(state.rules || []);
        setCustomPresets(state.customPresets || []);
        setLogs(state.logs || []);
        if (state.startMinimized !== undefined) setStartMinimized(state.startMinimized);
      });

      const removeListener = window.api.onStateChange((newState) => {
        if (newState.isMonitoring !== undefined) setIsMonitoring(newState.isMonitoring);
        if (newState.sources) setSources(newState.sources);
        if (newState.defaultDest !== undefined) setDefaultDest(newState.defaultDest);
        if (newState.rules) setRules(newState.rules);
        if (newState.customPresets) setCustomPresets(newState.customPresets);
        if (newState.logs) setLogs(newState.logs);
        if (newState.startMinimized !== undefined) setStartMinimized(newState.startMinimized);
      });

      return () => removeListener();
    }
  }, []);

  return useMemo(() => ({
    isMonitoring,
    sources,
    defaultDest,
    rules,
    customPresets,
    logs,
    startMinimized
  }), [isMonitoring, sources, defaultDest, rules, customPresets, logs, startMinimized]);
}
