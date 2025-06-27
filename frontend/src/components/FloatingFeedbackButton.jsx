import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircleMore, Trophy, MoreVertical } from 'lucide-react';

const FloatingFeedbackButton = ({ hasNewFeedback = true }) => {
    const navigate = useNavigate();
    const buttonRef = useRef(null);
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('feedbackBtnPosition');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                if (
                    typeof parsed.x === 'number' &&
                    typeof parsed.y === 'number' &&
                    parsed.x >= 0 && parsed.x <= window.innerWidth &&
                    parsed.y >= 0 && parsed.y <= window.innerHeight
                ) {
                    return parsed;
                }
            } catch (error) {
                console.error('Failed to parse saved position:', error);
            }
        }
        return { x: 20, y: window.innerHeight - 100 };
    });


    const [dragging, setDragging] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [inactive, setInactive] = useState(false);
    const offset = useRef({ x: 0, y: 0 });
    const timer = useRef(null);

    const resetInactivity = () => {
        setInactive(false);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setInactive(true), 8000); // 8 seconds to sleep
    };
    // <MessageCircleMore className="w-4 h-4" />
    // Handle drag move
    const handleMove = (e) => {
        if (!dragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const newX = clientX - offset.current.x;
        const newY = clientY - offset.current.y;

        const clampedX = Math.max(0, Math.min(window.innerWidth - 60, newX));
        const clampedY = Math.max(0, Math.min(window.innerHeight - 60, newY));

        setPosition({ x: clampedX, y: clampedY });
        resetInactivity();
    };

    const stopDragging = () => {
        if (dragging) {
            setDragging(false);
            localStorage.setItem('feedbackBtnPosition', JSON.stringify(position));
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', stopDragging);

        resetInactivity(); // Start inactivity timer

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', stopDragging);
            clearTimeout(timer.current);
        };
    }, [dragging]);

    return (
        <div
            ref={buttonRef}
            onMouseDown={(e) => {
                offset.current = {
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                };
                setDragging(true);
                resetInactivity();
            }}
            onTouchStart={(e) => {
                offset.current = {
                    x: e.touches[0].clientX - position.x,
                    y: e.touches[0].clientY - position.y,
                };
                setDragging(true);
                resetInactivity();
            }}
            onClick={() => {
                setExpanded((prev) => !prev);
                resetInactivity();
            }}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 9999,
                cursor: dragging ? 'grabbing' : 'pointer',
                opacity: inactive ? 0.3 : 1,
                transition: dragging ? 'none' : 'opacity 0.5s, transform 0.3s',
                touchAction: 'none',
            }}
        >
            <div className="relative">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center"
                >
                    <MoreVertical size={20} />
                </button>
                {expanded && (
                    <div className="absolute bottom-14 right-0 space-y-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/feedback');
                                setExpanded(false);
                            }}
                            className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-full shadow"
                        >
                            <MessageCircleMore size={16} />
                            <span>Feedback</span>
                            {hasNewFeedback && (
                                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            )}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/rankings');
                                setExpanded(false);
                            }}
                            className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-full shadow"
                        >
                            <Trophy size={16} />
                            <span>Rankings</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloatingFeedbackButton;
