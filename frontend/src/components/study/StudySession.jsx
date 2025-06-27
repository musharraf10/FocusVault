import { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';

const SessionManager = ({ currentSession, isStudying, updateSessionTime, onTimeUpdate }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const sessionRef = useRef({
        startTime: null,
        lastSavedTime: null,
        sessionId: null,
        baseElapsedTime: 0,
        alarmTriggered: false,
    });

    const animationFrameRef = useRef(null);
    const intervalRef = useRef(null);

    // Setup session
    useEffect(() => {
        if (!currentSession || !isStudying) {
            setElapsedTime(0);
            sessionRef.current = { startTime: null, lastSavedTime: null, sessionId: null, baseElapsedTime: 0, alarmTriggered: false };
            localStorage.removeItem('studySession');
            cancelAnimationFrame(animationFrameRef.current);
            clearInterval(intervalRef.current);
            return;
        }

        const saved = localStorage.getItem('studySession');
        const now = Date.now();
        if (saved) {
            const { sessionId, startTime, baseElapsedTime } = JSON.parse(saved);
            if (sessionId === currentSession.sessionId) {
                const elapsed = Math.floor((now - startTime) / 1000) + baseElapsedTime;
                sessionRef.current = { sessionId, startTime, lastSavedTime: null, baseElapsedTime, alarmTriggered: false };
                setElapsedTime(elapsed);
            }
        }

        if (!saved || (saved && JSON.parse(saved).sessionId !== currentSession.sessionId)) {
            const startTime = now;
            const baseElapsed = currentSession.elapsedTime || 0;
            sessionRef.current = {
                sessionId: currentSession.sessionId,
                startTime,
                lastSavedTime: null,
                baseElapsedTime: baseElapsed,
                alarmTriggered: false,
            };
            setElapsedTime(baseElapsed);
            localStorage.setItem(
                'studySession',
                JSON.stringify({ sessionId: currentSession.sessionId, startTime, baseElapsedTime: baseElapsed })
            );
        }
    }, [currentSession?.sessionId, isStudying]);

    // Timer update logic (requestAnimationFrame)
    const updateTimeLoop = () => {
        if (!isStudying || !sessionRef.current.startTime) return;
        const now = Date.now();
        const elapsed = sessionRef.current.baseElapsedTime + Math.floor((now - sessionRef.current.startTime) / 1000);
        setElapsedTime(elapsed);
        const targetTime = currentSession?.targetTime || Number.MAX_SAFE_INTEGER;
        if (elapsed === targetTime && !sessionRef.current.alarmTriggered) {
            sessionRef.current.alarmTriggered = true;
            onTimeUpdate(elapsed);
        } else if (elapsed < targetTime) {
            sessionRef.current.alarmTriggered = false;
        }
        animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
    };

    // Visibility-based logic
    useEffect(() => {
        const switchToInterval = () => {
            cancelAnimationFrame(animationFrameRef.current);
            clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                if (!isStudying || !sessionRef.current.startTime) return;
                const now = Date.now();
                const elapsed = sessionRef.current.baseElapsedTime + Math.floor((now - sessionRef.current.startTime) / 1000);
                setElapsedTime(elapsed);
                const targetTime = currentSession?.targetTime || Number.MAX_SAFE_INTEGER;
                if (elapsed === targetTime && !sessionRef.current.alarmTriggered) {
                    sessionRef.current.alarmTriggered = true;
                    onTimeUpdate(elapsed);
                } else if (elapsed < targetTime) {
                    sessionRef.current.alarmTriggered = false;
                }
            }, 1000);
        };

        const switchToAnimation = () => {
            clearInterval(intervalRef.current);
            animationFrameRef.current = requestAnimationFrame(updateTimeLoop);
        };

        const handleVisibility = () => {
            if (document.hidden) {
                switchToInterval();
            } else {
                switchToAnimation();
            }
        };

        if (isStudying) {
            if (document.hidden) {
                switchToInterval();
            } else {
                switchToAnimation();
            }
        }

        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            cancelAnimationFrame(animationFrameRef.current);
            clearInterval(intervalRef.current);
        };
    }, [isStudying]);

    const saveSessionTimeImmediate = async () => {
        if (!currentSession || !isStudying) return;

        const now = Date.now();
        const elapsed = sessionRef.current.baseElapsedTime + Math.floor((now - sessionRef.current.startTime) / 1000);
        try {
            await updateSessionTime(currentSession.sessionId, elapsed);
            sessionRef.current.baseElapsedTime = elapsed;
            sessionRef.current.startTime = now;
            localStorage.setItem(
                'studySession',
                JSON.stringify({
                    sessionId: currentSession.sessionId,
                    startTime: now,
                    baseElapsedTime: elapsed,
                })
            );
        } catch (err) {
            console.error('Update failed:', err);
            toast.error('Failed to update session time.');
        }
    };

    const saveSessionTime = debounce(saveSessionTimeImmediate, 30000);

    // Reset on unload
    useEffect(() => {
        const handleUnload = () => {
            if (isStudying && currentSession) saveSessionTimeImmediate();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [isStudying, currentSession?.sessionId]);

    return {
        elapsedTime,
        saveSessionTimeImmediate,
        resetSession: () => {
            setElapsedTime(0);
            cancelAnimationFrame(animationFrameRef.current);
            clearInterval(intervalRef.current);
            sessionRef.current = { startTime: null, lastSavedTime: null, sessionId: null, baseElapsedTime: 0, alarmTriggered: false };
            localStorage.removeItem('studySession');
        },
    };
};

export default SessionManager;