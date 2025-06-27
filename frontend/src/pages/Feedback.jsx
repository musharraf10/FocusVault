import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    ChatBubbleLeftRightIcon,
    HeartIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    TrashIcon,
    CheckBadgeIcon,
    CalendarIcon,
    UserIcon,
    HandThumbUpIcon,
    ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';
import { useFeedback } from '../context/FeedbackContext';
import StarRating, { CompactStarRating } from '../components/StarRating';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FeedbackPage = ({ user }) => {
    const {
        feedback,
        loading,
        submitting,
        error,
        fetchFeedback,
        submitFeedback,
        toggleUpvote,
        deleteFeedback,
        clearError,
        markAsSeen,
        replyToFeedback,
    } = useFeedback();
    const navigate = useNavigate();

    // Component state
    const [activeTab, setActiveTab] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        text: '',
        type: 'general',
        rating: 0,
        suggestion: '',
    });
    const [replyModal, setReplyModal] = useState({ open: false, feedbackId: null });
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    // Fetch feedback on component mount
    useEffect(() => {
        fetchFeedback();
        markAsSeen();
    }, [fetchFeedback]);

    // Clear errors after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    // Tab configuration
    const tabs = [
        {
            id: 'all',
            label: 'All Feedback',
            icon: ChatBubbleLeftRightIcon,
            count: Object.values(feedback).flat().length,
        },
        {
            id: 'positive',
            label: 'Positive',
            icon: HeartIcon,
            count: feedback.positive?.length || 0,
            color: 'text-green-600 dark:text-green-400',
        },
        {
            id: 'moderate',
            label: 'Moderate',
            icon: ExclamationTriangleIcon,
            count: feedback.moderate?.length || 0,
            color: 'text-yellow-600 dark:text-yellow-400',
        },
        {
            id: 'general',
            label: 'General',
            icon: InformationCircleIcon,
            count: feedback.general?.length || 0,
            color: 'text-blue-600 dark:text-blue-400',
        },
    ];

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Please log in to submit feedback');
            return;
        }

        if (formData.text.trim().length < 10) {
            alert('Feedback must be at least 10 characters long');
            return;
        }

        const result = await submitFeedback(formData);

        if (result.success) {
            setFormData({
                text: '',
                type: 'general',
                rating: 0,
                suggestion: '',
            });
            setShowForm(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Helper function to get feedback type by ID
    const getFeedbackType = (feedbackId) => {
        for (const type of ['positive', 'moderate', 'general']) {
            if (feedback[type]?.some(item => item._id === feedbackId)) {
                return type;
            }
        }
        return 'general'; // Fallback
    };

    // Handle reply submission
    const handleReplySubmit = async () => {
        if (!user) {
            alert('Please log in to reply');
            return;
        }

        if (!replyText.trim() || replyText.length < 5) {
            alert('Reply must be at least 5 characters long');
            return;
        }

        setIsReplying(true);
        const feedbackType = activeTab === 'all' ? getFeedbackType(replyModal.feedbackId) : activeTab;
        const result = await replyToFeedback(replyModal.feedbackId, replyText, feedbackType);
        setIsReplying(false);

        if (result.success) {
            setReplyText('');
        } else {
            alert(result.error); // Or use toast.error for consistency
        }
    };

    // Open reply modal
    const openReplyModal = (feedbackId) => {
        setReplyModal({ open: true, feedbackId });
    };

    // Close reply modal
    const closeReplyModal = () => {
        setReplyModal({ open: false, feedbackId: null });
        setReplyText('');
    };

    // Get feedback responses by ID
    const getFeedbackResponses = (feedbackId) => {
        const feedbackItem = Object.values(feedback)
            .flat()
            .find(item => item._id === feedbackId);
        return feedbackItem?.responses || [];
    };

    // Get type badge styling
    const getTypeBadge = (type) => {
        const badgeStyles = {
            positive: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
            moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50',
            general: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
        };

        return `px-2 py-1 rounded-full text-xs font-medium border ${badgeStyles[type] || badgeStyles.general}`;
    };

    // Filter feedback based on active tab
    const getFilteredFeedback = useMemo(() => {
        if (activeTab === 'all') {
            return [
                ...(feedback.positive || []).map(item => ({ ...item, responses: item.responses || [] })),
                ...(feedback.moderate || []).map(item => ({ ...item, responses: item.responses || [] })),
                ...(feedback.general || []).map(item => ({ ...item, responses: item.responses || [] })),
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return (feedback[activeTab] || []).map(item => ({ ...item, responses: item.responses || [] }));
    }, [feedback, activeTab]);

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Handle upvote
    const handleUpvote = async (feedbackId) => {
        if (!user) {
            alert('Please log in to upvote');
            return;
        }
        await toggleUpvote(feedbackId);
    };

    // Handle delete
    const handleDelete = async (feedbackId, type) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) {
            return;
        }
        await deleteFeedback(feedbackId, type);
    };

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header with Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 relative"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBack}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </motion.button>

                    <h1 className="text-4xl font speeches-bold text-gray-900 dark:text-white mb-4">
                        Feedback Hub
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Share your thoughts, experiences, and suggestions to help us improve our study platform
                    </p>
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg p-4"
                        >
                            <div className="flex items-center">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                                <span className="text-red-800 dark:text-red-300">{error}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Feedback Button */}
                {user && user.emailVerified && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 text-center"
                    >
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 transform hover:scale-105"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Share Your Feedback
                        </button>
                    </motion.div>
                )}

                {/* Feedback Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Submit New Feedback
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Feedback Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Feedback Type
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => handleInputChange('type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="general">General Feedback</option>
                                            <option value="positive">Positive Experience</option>
                                            <option value="moderate">Moderate Concern</option>
                                        </select>
                                    </div>

                                    {/* Feedback Text */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your Feedback *
                                        </label>
                                        <textarea
                                            value={formData.text}
                                            onChange={(e) => handleInputChange('text', e.target.value)}
                                            placeholder="Share your thoughts, experiences, or suggestions..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[120px] resize-vertical"
                                            required
                                            minLength={10}
                                            maxLength={1000}
                                        />
                                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formData.text.length}/1000 characters
                                        </div>
                                    </div>

                                    {/* Star Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Rating
                                        </label>
                                        <StarRating
                                            rating={formData.rating}
                                            onRatingChange={(rating) => handleInputChange('rating', rating)}
                                            size="md"
                                        />
                                    </div>

                                    {/* Suggestion */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Suggestions for Improvement (Optional)
                                        </label>
                                        <textarea
                                            value={formData.suggestion}
                                            onChange={(e) => handleInputChange('suggestion', e.target.value)}
                                            placeholder="Any specific suggestions or ideas..."
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[80px] resize-vertical"
                                            maxLength={500}
                                        />
                                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formData.suggestion.length}/500 characters
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="flex flex-wrap justify-between gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    flex items-center justify-between gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all 
                    flex-1 min-w-[120px] sm:min-w-[140px] max-w-full 
                    ${activeTab === tab.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }
                  `}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${tab.color || ''}`} />
                                    <span className="truncate">{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span
                                            className={`
                        text-xs px-2 py-1 rounded-full shrink-0
                        ${activeTab === tab.id
                                                    ? 'bg-blue-200 dark:bg-blue-700/50 text-blue-800 dark:text-blue-300'
                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                }
                      `}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading feedback...</p>
                    </div>
                )}

                {/* Feedback List */}
                {!loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {getFilteredFeedback.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No feedback yet
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {activeTab === 'all'
                                        ? 'Be the first to share your feedback!'
                                        : `No ${activeTab} feedback has been submitted yet.`}
                                </p>
                            </div>
                        ) : (
                            getFilteredFeedback.map((item, index) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                                >
                                    {/* Feedback Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* Profile Image */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 flex items-center justify-center">
                                                {item.profileImage ? (
                                                    <img
                                                        src={item.profileImage}
                                                        alt={item.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <UserIcon className="w-5 h-5 text-white" />
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {item.name}
                                                    </span>
                                                    {item.isVerifiedUser && (
                                                        <CheckBadgeIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span className="text-xs">{formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        <span className={getTypeBadge(item.type)}>{item.type}</span>
                                    </div>

                                    {/* Feedback Content */}
                                    <div className="mb-4">
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {item.text}
                                        </p>
                                    </div>

                                    {/* Rating */}
                                    {item.rating && (
                                        <div className="mb-4">
                                            <CompactStarRating rating={item.rating} />
                                        </div>
                                    )}

                                    {/* Suggestion */}
                                    {item.suggestion && (
                                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-400 dark:border-blue-600">
                                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                                                Suggestion:
                                            </h4>
                                            <p className="text-blue-800 dark:text-blue-300 text-sm">
                                                {item.suggestion}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            {/* Upvote Button */}
                                            <button
                                                onClick={() => handleUpvote(item._id)}
                                                disabled={!user}
                                                className={`
                          flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors
                          ${item.hasUserUpvoted
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }
                          ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                                            >
                                                {item.hasUserUpvoted ? (
                                                    <HandThumbUpIconSolid className="w-4 h-4" />
                                                ) : (
                                                    <HandThumbUpIcon className="w-4 h-4" />
                                                )}
                                                <span>
                                                    {Array.isArray(item.upvotes) ? item.upvotes.length : 0}
                                                </span>
                                            </button>

                                            {/* Reply Button */}
                                            <button
                                                onClick={() => openReplyModal(item._id)}
                                                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <ChatBubbleOvalLeftIcon className="w-4 h-4" />
                                                <span>Reply ({item.responses?.length || 0})</span>
                                            </button>
                                        </div>

                                        {/* Delete Button (only for feedback owner) */}
                                        {user && user._id === item.userId._id && (
                                            <button
                                                onClick={() => handleDelete(item._id, item.type)}
                                                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {/* Reply Modal */}
                <AnimatePresence>
                    {replyModal.open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Responses
                                    </h3>
                                    <button
                                        onClick={closeReplyModal}
                                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {getFeedbackResponses(replyModal.feedbackId).length === 0 ? (
                                        <p className="text-gray-600 dark:text-gray-300 text-center">
                                            No responses yet. Be the first to respond!
                                        </p>
                                    ) : (
                                        getFeedbackResponses(replyModal.feedbackId).map((reply, replyIndex) => (
                                            <div
                                                key={reply._id || replyIndex}
                                                className="mb-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {reply.name || 'Anonymous'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(reply.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {reply.text}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Sticky Reply Input */}
                                {user && user.emailVerified && (
                                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                                        <div className="flex gap-2">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your reply..."
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[60px] resize-none"
                                                maxLength={500}
                                            />
                                            <button
                                                onClick={handleReplySubmit}
                                                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!replyText.trim() || isReplying}
                                            >
                                                {isReplying ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {replyText.length}/500 characters
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FeedbackPage;