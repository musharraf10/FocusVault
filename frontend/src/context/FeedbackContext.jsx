import React, { createContext, useContext, useReducer, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const FeedbackContext = createContext();

const ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_FEEDBACK: 'SET_FEEDBACK',
    ADD_FEEDBACK: 'ADD_FEEDBACK',
    UPDATE_FEEDBACK: 'UPDATE_FEEDBACK',
    REMOVE_FEEDBACK: 'REMOVE_FEEDBACK',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_STATS: 'SET_STATS',
    TOGGLE_UPVOTE: 'TOGGLE_UPVOTE',
    SET_PAGINATION: 'SET_PAGINATION',
};

const initialState = {
    feedback: { positive: [], moderate: [], general: [] },
    stats: { totalFeedback: 0, stats: [] },
    pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasNext: false, hasPrev: false, limit: 10 },
    loading: false,
    submitting: false,
    error: null,
};

function feedbackReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload.loading, submitting: action.payload.submitting || state.submitting };

        case ACTIONS.SET_FEEDBACK:
            return { ...state, feedback: action.payload, loading: false, error: null };

        case ACTIONS.ADD_FEEDBACK:
            const newFeedback = action.payload;
            if (!state.feedback[newFeedback.type]) return state;
            return {
                ...state,
                feedback: {
                    ...state.feedback,
                    [newFeedback.type]: [newFeedback, ...state.feedback[newFeedback.type]],
                },
                submitting: false,
                error: null,
            };

        case ACTIONS.UPDATE_FEEDBACK:
            const { feedbackId, reply, type } = action.payload; // Expect reply to be the new reply object
            if (!state.feedback[type]) return state;
            return {
                ...state,
                feedback: {
                    ...state.feedback,
                    [type]: state.feedback[type].map(item =>
                        item._id === feedbackId
                            ? {
                                ...item,
                                responses: [...(item.responses || []), reply], // Append the new reply
                            }
                            : item
                    ),
                },
            };

        case ACTIONS.REMOVE_FEEDBACK:
            return {
                ...state,
                feedback: {
                    ...state.feedback,
                    [action.payload.type]: state.feedback[action.payload.type].filter(item => item._id !== action.payload.feedbackId),
                },
            };

        case ACTIONS.TOGGLE_UPVOTE:
            const { id, upvoteData } = action.payload;
            const updatedFeedback = { ...state.feedback };
            Object.keys(updatedFeedback).forEach(type => {
                updatedFeedback[type] = updatedFeedback[type].map(item =>
                    item._id === id ? { ...item, upvotes: upvoteData.upvotes, hasUserUpvoted: upvoteData.hasUserUpvoted } : item
                );
            });
            return { ...state, feedback: updatedFeedback };

        case ACTIONS.SET_STATS:
            return { ...state, stats: action.payload };

        case ACTIONS.SET_PAGINATION:
            return { ...state, pagination: action.payload };

        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, loading: false, submitting: false };

        case ACTIONS.CLEAR_ERROR:
            return { ...state, error: null };

        default:
            return state;
    }
}

export function FeedbackProvider({ children }) {
    const [state, dispatch] = useReducer(feedbackReducer, initialState);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const getAuthToken = () => localStorage.getItem('token');
    const getConfig = () => ({ headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });

    const fetchFeedback = useCallback(async (page = 1, type = null) => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: { loading: true } });
        try {
            const params = new URLSearchParams({ page, limit: state.pagination.limit });
            if (type) params.append('type', type);

            const response = await axios.get(`${API_URL}/api/feedback?${params}`);
            if (response.data.success) {
                dispatch({ type: ACTIONS.SET_FEEDBACK, payload: response.data.data.feedback });
                dispatch({ type: ACTIONS.SET_PAGINATION, payload: response.data.data.pagination });
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch feedback';
            dispatch({ type: ACTIONS.SET_ERROR, payload: message });
            toast.error(message);
        }
    }, [API_URL, state.pagination.limit]);

    const submitFeedback = useCallback(async (feedbackData) => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: { submitting: true } });
        try {
            const response = await axios.post(`${API_URL}/api/feedback`, feedbackData, getConfig());
            if (response.data.success) {
                dispatch({ type: ACTIONS.ADD_FEEDBACK, payload: response.data.data });
                toast.success('Feedback submitted successfully!');
                return { success: true, data: response.data.data };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to submit feedback';
            dispatch({ type: ACTIONS.SET_ERROR, payload: message });
            toast.error(message);
            return { success: false, error: message };
        }
    }, [API_URL]);

    const replyToFeedback = useCallback(async (feedbackId, replyText, feedbackType) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/feedback/${feedbackId}/reply`,
                { text: replyText },
                getConfig()
            );
            if (response.data.success) {
                dispatch({
                    type: ACTIONS.UPDATE_FEEDBACK,
                    payload: {
                        feedbackId,
                        reply: response.data.data, // The new reply object
                        type: feedbackType,
                    },
                });
                toast.success('Reply added successfully!');
                return { success: true, data: response.data.data };
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to add reply';
            toast.error(message);
            return { success: false, error: message };
        }
    }, [API_URL]);

    const toggleUpvote = useCallback(async (feedbackId) => {
        try {
            const response = await axios.put(`${API_URL}/api/feedback/${feedbackId}/upvote`, {}, getConfig());
            if (response.data.success) {
                dispatch({ type: ACTIONS.TOGGLE_UPVOTE, payload: { id: feedbackId, upvoteData: response.data.data } });
                return response.data.data;
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to toggle upvote';
            toast.error(message);
        }
    }, [API_URL]);

    const deleteFeedback = useCallback(async (feedbackId, type) => {
        try {
            const response = await axios.delete(`${API_URL}/api/feedback/${feedbackId}`, getConfig());
            if (response.data.success) {
                dispatch({ type: ACTIONS.REMOVE_FEEDBACK, payload: { feedbackId, type } });
                toast.success('Feedback deleted successfully');
                return true;
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to delete feedback';
            toast.error(message);
            return false;
        }
    }, [API_URL]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/feedback/stats`);
            if (response.data.success) dispatch({ type: ACTIONS.SET_STATS, payload: response.data.data });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, [API_URL]);

    const markAsSeen = async () => {
        try {
            await axios.put(`${API_URL}/api/feedback/mark-seen`, {}, getConfig());
        } catch (err) {
            console.error('Failed to mark feedback as seen:', err.message);
        }
    };

    const clearError = useCallback(() => {
        dispatch({ type: ACTIONS.CLEAR_ERROR });
    }, []);

    return (
        <FeedbackContext.Provider value={{
            ...state,
            fetchFeedback,
            submitFeedback,
            replyToFeedback,
            toggleUpvote,
            deleteFeedback,
            fetchStats,
            markAsSeen,
            clearError
        }}>
            {children}
        </FeedbackContext.Provider>
    );
}

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) throw new Error('useFeedback must be used within FeedbackProvider');
    return context;
};

export default FeedbackContext;
