// context/FeedbackContext.jsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Assuming you're using react-hot-toast

const FeedbackContext = createContext();

// Action types
const FEEDBACK_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_FEEDBACK: 'SET_FEEDBACK',
    ADD_FEEDBACK: 'ADD_FEEDBACK',
    UPDATE_FEEDBACK: 'UPDATE_FEEDBACK',
    REMOVE_FEEDBACK: 'REMOVE_FEEDBACK',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_STATS: 'SET_STATS',
    TOGGLE_UPVOTE: 'TOGGLE_UPVOTE',
    SET_PAGINATION: 'SET_PAGINATION'
};

// Initial state
const initialState = {
    feedback: {
        positive: [],
        moderate: [],
        general: []
    },
    stats: {
        totalFeedback: 0,
        stats: []
    },
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false,
        limit: 10
    },
    loading: false,
    submitting: false,
    error: null
};

// Reducer
const feedbackReducer = (state, action) => {
    switch (action.type) {
        case FEEDBACK_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload.loading,
                submitting: action.payload.submitting || state.submitting
            };

        case FEEDBACK_ACTIONS.SET_FEEDBACK:
            return {
                ...state,
                feedback: action.payload,
                loading: false,
                error: null
            };

        case FEEDBACK_ACTIONS.ADD_FEEDBACK:
            const newFeedback = action.payload;
            const feedbackType = newFeedback.type;

            // Validate feedbackType
            if (!['positive', 'moderate', 'general'].includes(feedbackType)) {
                console.error(`Invalid feedback type: ${feedbackType}`);
                return {
                    ...state,
                    submitting: false,
                    error: `Invalid feedback type: ${feedbackType}`
                };
            }

            return {
                ...state,
                feedback: {
                    ...state.feedback,
                    [feedbackType]: [newFeedback, ...(state.feedback[feedbackType] || [])]
                },
                submitting: false,
                error: null
            };

        case FEEDBACK_ACTIONS.UPDATE_FEEDBACK:
            const updatedFeedback = action.payload;
            const updateType = updatedFeedback.type;
            return {
                ...state,
                feedback: {
                    ...state.feedback,
                    [updateType]: state.feedback[updateType].map(item =>
                        item._id === updatedFeedback._id ? updatedFeedback : item
                    )
                }
            };

        case FEEDBACK_ACTIONS.REMOVE_FEEDBACK:
            const { feedbackId, type } = action.payload;
            return {
                ...state,
                feedback: {
                    ...state.feedback,
                    [type]: state.feedback[type].filter(item => item._id !== feedbackId)
                }
            };

        case FEEDBACK_ACTIONS.TOGGLE_UPVOTE:
            const { id, upvoteData } = action.payload;
            const updatedFeedbackState = { ...state.feedback };

            Object.keys(updatedFeedbackState).forEach(type => {
                updatedFeedbackState[type] = updatedFeedbackState[type].map(item =>
                    item._id === id
                        ? {
                            ...item,
                            upvotes: upvoteData.upvotes,
                            hasUserUpvoted: upvoteData.hasUserUpvoted
                        }
                        : item
                );
            });

            return {
                ...state,
                feedback: updatedFeedbackState
            };


        case FEEDBACK_ACTIONS.SET_STATS:
            return {
                ...state,
                stats: action.payload
            };

        case FEEDBACK_ACTIONS.SET_PAGINATION:
            return {
                ...state,
                pagination: action.payload
            };

        case FEEDBACK_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
                submitting: false
            };

        case FEEDBACK_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
};

// Provider component
export const FeedbackProvider = ({ children }) => {
    const [state, dispatch] = useReducer(feedbackReducer, initialState);

    // API base URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Axios config with auth
    const getAxiosConfig = () => ({
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
        }
    });

    // Fetch all feedback
    const fetchFeedback = useCallback(async (page = 1, type = null) => {
        dispatch({ type: FEEDBACK_ACTIONS.SET_LOADING, payload: { loading: true } });

        try {
            const params = new URLSearchParams({ page, limit: state.pagination.limit });
            if (type) params.append('type', type);

            const response = await axios.get(`${API_URL}/api/feedback?${params}`);

            if (response.data.success) {
                dispatch({ type: FEEDBACK_ACTIONS.SET_FEEDBACK, payload: response.data.data.feedback });
                dispatch({ type: FEEDBACK_ACTIONS.SET_PAGINATION, payload: response.data.data.pagination });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch feedback';
            dispatch({ type: FEEDBACK_ACTIONS.SET_ERROR, payload: errorMessage });
            toast.error(errorMessage);
        }
    }, [API_URL, state.pagination.limit]);

    // Submit new feedback
    const submitFeedback = useCallback(async (feedbackData) => {
        dispatch({ type: FEEDBACK_ACTIONS.SET_LOADING, payload: { submitting: true } });

        try {
            const response = await axios.post(`${API_URL}/api/feedback`, feedbackData, getAxiosConfig());

            if (response.data.success) {
                dispatch({ type: FEEDBACK_ACTIONS.ADD_FEEDBACK, payload: response.data.data });
                toast.success('Feedback submitted successfully!');
                return { success: true, data: response.data.data };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to submit feedback';
            dispatch({ type: FEEDBACK_ACTIONS.SET_ERROR, payload: errorMessage });
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [API_URL]);

    // Toggle upvote
    const toggleUpvote = useCallback(async (feedbackId) => {
        try {
            const response = await axios.put(`${API_URL}/api/feedback/${feedbackId}/upvote`, {}, getAxiosConfig());

            if (response.data.success) {
                dispatch({
                    type: FEEDBACK_ACTIONS.TOGGLE_UPVOTE,
                    payload: {
                        id: feedbackId,
                        upvoteData: response.data.data
                    }
                });
                return response.data.data;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to toggle upvote';
            toast.error(errorMessage);
        }
    }, [API_URL]);

    // Delete feedback
    const deleteFeedback = useCallback(async (feedbackId, type) => {
        try {
            const response = await axios.delete(`${API_URL}/api/feedback/${feedbackId}`, getAxiosConfig());

            if (response.data.success) {
                dispatch({
                    type: FEEDBACK_ACTIONS.REMOVE_FEEDBACK,
                    payload: { feedbackId, type }
                });
                toast.success('Feedback deleted successfully');
                return true;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete feedback';
            toast.error(errorMessage);
            return false;
        }
    }, [API_URL]);

    // Fetch feedback statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/feedback/stats`);

            if (response.data.success) {
                dispatch({ type: FEEDBACK_ACTIONS.SET_STATS, payload: response.data.data });
            }
        } catch (error) {
            console.error('Failed to fetch feedback stats:', error);
        }
    }, [API_URL]);


    const markAsSeen = async () => {
        try {
            await axios.put(`${API_URL}/api/feedback/mark-seen`);
        } catch (err) {
            console.error('Failed to mark feedback as seen:', err.message);
        }
    };


    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: FEEDBACK_ACTIONS.CLEAR_ERROR });
    }, []);

    // Context value
    const value = {
        // State
        ...state,

        // Actions
        fetchFeedback,
        submitFeedback,
        markAsSeen,
        toggleUpvote,
        deleteFeedback,
        fetchStats,
        clearError
    };

    return (
        <FeedbackContext.Provider value={value}>
            {children}
        </FeedbackContext.Provider>
    );
};

// Custom hook to use feedback context
export const useFeedback = () => {
    const context = useContext(FeedbackContext);

    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }

    return context;
};

export default FeedbackContext;