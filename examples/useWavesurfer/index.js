var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
// import { jsx as _jsx } from "react/jsx-runtime";
import * as ReactJSXRuntime from 'react/jsx-runtime'
const { jsx: _jsx, jsxs: _jsxs, Fragment: _Fragment } = ReactJSXRuntime
/**
 * A React component for wavesurfer.js
 *
 * Usage:
 *
 * import WavesurferPlayer from '@wavesurfer/react'
 *
 * <WavesurferPlayer
 *   url="/my-server/audio.ogg"
 *   waveColor="purple"
 *   height={100}
 *   onReady={(wavesurfer) => console.log('Ready!', wavesurfer)}
 * />
 */
// import { useState, useMemo, useEffect, useRef, memo } from 'react';
import * as React from 'react'
const { useState, useMemo, useEffect, useRef, memo } = React
import WaveSurfer from '/dist/wavesurfer.js';
/**
 * Use wavesurfer instance
 */

function useWavesurferInstance(containerRef, options) {
    const [wavesurfer, setWavesurfer] = useState(null);
    // Flatten options object to an array of keys and values to compare them deeply in the hook deps
    // Exclude plugins from deep comparison since they are mutated during initialization
    const optionsWithoutPlugins = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { plugins } = options, rest = __rest(options, ["plugins"]);
        return rest;
    }, [options]);
    const flatOptions = useMemo(() => Object.entries(optionsWithoutPlugins).flat(), [optionsWithoutPlugins]);
    // Create a wavesurfer instance
    useEffect(() => {
        if (!(containerRef === null || containerRef === void 0 ? void 0 : containerRef.current))
            return;
        const ws = WaveSurfer.create(Object.assign(Object.assign({}, optionsWithoutPlugins), { plugins: options.plugins, container: containerRef.current }));
        setWavesurfer(ws);
        return () => {
            ws.destroy();
        };
        // Only recreate if plugins array reference changes (not on mutation)
        // Users should memoize the plugins array to prevent unnecessary re-creation
    }, [containerRef, options.plugins, ...flatOptions]);
    return wavesurfer;
}
/**
 * Use wavesurfer state
 */
function useWavesurferState(wavesurfer) {
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    useEffect(() => {
        if (!wavesurfer)
            return;
        const unsubscribeFns = [
            wavesurfer.on('load', () => {
                setIsReady(false);
                setIsPlaying(false);
                setCurrentTime(0);
            }),
            wavesurfer.on('ready', () => {
                setIsReady(true);
                setIsPlaying(false);
                setHasFinished(false);
                setCurrentTime(0);
            }),
            wavesurfer.on('finish', () => {
                setHasFinished(true);
            }),
            wavesurfer.on('play', () => {
                setIsPlaying(true);
            }),
            wavesurfer.on('pause', () => {
                setIsPlaying(false);
            }),
            wavesurfer.on('timeupdate', () => {
                setCurrentTime(wavesurfer.getCurrentTime());
            }),
            wavesurfer.on('destroy', () => {
                setIsReady(false);
                setIsPlaying(false);
            }),
        ];
        return () => {
            unsubscribeFns.forEach((fn) => fn());
        };
    }, [wavesurfer]);
    return useMemo(() => ({
        isReady,
        isPlaying,
        hasFinished,
        currentTime,
    }), [isPlaying, hasFinished, currentTime, isReady]);
}
const EVENT_PROP_RE = /^on([A-Z])/;
const isEventProp = (key) => EVENT_PROP_RE.test(key);
const getEventName = (key) => key.replace(EVENT_PROP_RE, (_, $1) => $1.toLowerCase());
/**
 * Parse props into wavesurfer options and events
 */
function useWavesurferProps(props) {
    // Props starting with `on` are wavesurfer events, e.g. `onReady`
    // The rest of the props are wavesurfer options
    return useMemo(() => {
        const allOptions = Object.assign({}, props);
        const allEvents = Object.assign({}, props);
        for (const key in allOptions) {
            if (isEventProp(key)) {
                delete allOptions[key];
            }
            else {
                delete allEvents[key];
            }
        }
        return [allOptions, allEvents];
    }, [props]);
}
/**
 * Subscribe to wavesurfer events
 */
function useWavesurferEvents(wavesurfer, events) {
    const flatEvents = useMemo(() => Object.entries(events).flat(), [events]);
    // Subscribe to events
    useEffect(() => {
        if (!wavesurfer)
            return;
        const eventEntries = Object.entries(events);
        if (!eventEntries.length)
            return;
        const unsubscribeFns = eventEntries.map(([name, handler]) => {
            const event = getEventName(name);
            return wavesurfer.on(event, (...args) => handler(wavesurfer, ...args));
        });
        return () => {
            unsubscribeFns.forEach((fn) => fn());
        };
    }, [wavesurfer, ...flatEvents]);
}
/**
 * Wavesurfer player component
 * @see https://wavesurfer.xyz/docs/modules/wavesurfer
 * @public
 */
const WavesurferPlayer = memo((props) => {
    const containerRef = useRef(null);
    const [options, events] = useWavesurferProps(props);
    const wavesurfer = useWavesurferInstance(containerRef, options);
    useWavesurferEvents(wavesurfer, events);
    // Create a container div
    return _jsx("div", { ref: containerRef });
});
/**
 * @public
 */
export default WavesurferPlayer;
/**
 * React hook for wavesurfer.js
 *
 * ```
 * import { useWavesurfer } from '@wavesurfer/react'
 *
 * const App = () => {
 *   const containerRef = useRef<HTMLDivElement | null>(null)
 *
 *   const { wavesurfer, isReady, isPlaying, hasFinished, currentTime } = useWavesurfer({
 *     container: containerRef,
 *     url: '/my-server/audio.ogg',
 *     waveColor: 'purple',
 *     height: 100',
 *   })
 *
 *   return <div ref={containerRef} />
 * }
 * ```
 *
 * @public
 */
export function useWavesurfer(_a) {
    var { container } = _a, options = __rest(_a, ["container"]);
    const wavesurfer = useWavesurferInstance(container, options);
    const state = useWavesurferState(wavesurfer);
    return useMemo(() => (Object.assign(Object.assign({}, state), { wavesurfer })), [state, wavesurfer]);
}
