import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Clock, Calendar, MessageCircle, Trophy } from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';
import toast from 'react-hot-toast';

const Tutorial = ({ onComplete }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [currentStep, setCurrentStep] = useState(0);

    const completeTutorial = async () => {
        try {
            await axios.patch(`${API_URL}/api/user/tutorial-complete`, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            toast.success('Tutorial completed successfully!');
            setCurrentStep(steps.length - 1);
            onComplete();
        } catch (error) {
            console.error('Error completing tutorial:', error);
            toast.error('Failed to complete tutorial. Please try again.');
            setCurrentStep(0);
        }
    }

    const steps = [
        {
            title: 'Welcome to Focus Vault!',
            description: 'Your personal study companion to track progress, manage tasks, and stay motivated.',
            icon: BookOpen,
            color: 'from-blue-500 to-blue-600',
            features: [
                'Track study sessions with smart timers',
                'Organize notes with tags and search',
                'Create weekly timetables',
                'Connect with study partners',
                'Set personal goals and reminders',
            ],
        },
        {
            title: 'Study Timer & Sessions',
            description: 'Start study sessions, track your progress, and build consistent habits.',
            icon: Clock,
            color: 'from-green-500 to-green-600',
            features: [
                'Set target study times',
                'Pause and resume sessions seamlessly',
                'Track actual vs target time',
                'Save session notes and feedback',
                'View detailed analytics and streaks',
            ],
        },
        {
            title: 'Timetables & Planning',
            description: 'Create up to 3 weekly timetables to organize your study schedule.',
            icon: Calendar,
            color: 'from-purple-500 to-purple-600',
            features: [
                'Flexible weekly schedule planning',
                'Subject-wise time allocation',
                'Multiple timetable support',
                'Calendar view integration for better planning',
                'Automatic reminders based on timetable',
            ],
        },
        {
            title: 'Study Chat Rooms',
            description: 'Connect with study partners for motivation, sharing, and accountability.',
            icon: MessageCircle,
            color: 'from-pink-500 to-pink-600',
            features: [
                'Real-time chat with study partners',
                'Share study progress updates',
                'Create and join study groups',
                'Set group study goals',
                'Organize discussions in room-based chats',
                'Receive motivational prompts in rooms',
            ],
        },
        {
            title: 'Notes & To-Do Lists',
            description: 'Manage your notes and daily tasks without leaving the app.',
            icon: BookOpen,
            color: 'from-indigo-500 to-indigo-600',
            features: [
                'Organize study notes with tags',
                'Rich-text editing for notes',
                'Add todos linked to subjects or sessions',
                'Set due dates and reminders for tasks',
                'Search and filter notes instantly',
            ],
        },
        {
            title: 'Rankings & Competition',
            description: 'See how you rank among other learners and stay motivated.',
            icon: Trophy,
            color: 'from-yellow-500 to-yellow-600',
            features: [
                'View your rank based on study hours',
                'Compare with friends and users',
                'overall progress leaderboards',
                'Track your current streak',
                'Earn achievements for milestones',
                'Friendly competitions with study partners',
            ],
        },
        {
            title: 'Feedback & Support',
            description: 'Help us improve and get the support you need for a better experience.',
            icon: MessageCircle,
            color: 'from-red-500 to-red-600',
            features: [
                'Send direct feedback from the app',
                'Access FAQs and help guides',
                'Report issues for quick resolution',
                'Join our community for tips and support',
                'Receive personalized tips based on your activity',
            ],
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => {
                const next = prev + 1;
                onStepChange?.(next);
                return next;
            });
        } else {
            completeTutorial();
            onComplete();
        }
    };

    const onStepChange = (step) => {
        if (step < 0 || step >= steps.length) return;
        setCurrentStep(step);
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const skipTutorial = () => {
        completeTutorial();
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 w-full max-w-sm sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6 sm:mb-8">
                    <div className="flex-1 min-w-0 pr-4">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white leading-tight">Quick Tour</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-1">Learn the basics in just a few minutes</p>
                    </div>
                    <button
                        onClick={skipTutorial}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg flex-shrink-0"
                    >
                        <X size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {Math.round(((currentStep + 1) / steps.length) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 sm:mb-8"
                    >
                        <div className="text-center mb-4 sm:mb-6">
                            <div
                                className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${steps[currentStep].color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg`}
                            >
                                {React.createElement(steps[currentStep].icon, {
                                    className: "w-8 h-8 sm:w-10 sm:h-10 text-white"
                                })}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 px-2">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed px-2">
                                {steps[currentStep].description}
                            </p>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            {steps[currentStep].features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl"
                                >
                                    <div
                                        className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${steps[currentStep].color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}
                                    >
                                        <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                                        {feature}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size={16} />
                        <span className="text-sm sm:text-base">Previous</span>
                    </motion.button>

                    <div className="hidden xs:flex space-x-1 sm:space-x-2">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentStep
                                    ? 'bg-blue-600 w-4 sm:w-6'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex xs:hidden items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {currentStep + 1}/{steps.length}
                        </span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        <span className="text-sm sm:text-base">
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                        </span>
                        {currentStep < steps.length - 1 && <ChevronRight size={16} />}
                    </motion.button>
                </div>

                <div className="text-center mt-4 sm:mt-6">
                    <button
                        onClick={skipTutorial}
                        className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline transition-colors"
                    >
                        Skip tutorial
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

Tutorial.propTypes = {
    onComplete: PropTypes.func.isRequired,
};

export default Tutorial;