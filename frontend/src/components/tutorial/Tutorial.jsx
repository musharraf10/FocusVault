// src/components/tutorial/Tutorial.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Clock, Calendar, MessageCircle, Trophy } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import PropTypes from 'prop-types';

const Tutorial = ({ onComplete }) => {
    const { completeTutorial } = useProfile();
    const [currentStep, setCurrentStep] = useState(0);

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
            ],
        },
        {
            title: 'Study Timer & Sessions',
            description: 'Start study sessions, track your progress, and build consistent habits.',
            icon: Clock,
            color: 'from-green-500 to-green-600',
            features: [
                'Set target study times',
                'Pause and resume sessions',
                'Track actual vs target time',
                'View detailed analytics',
            ],
        },
        {
            title: 'Timetables & Planning',
            description: 'Create up to 3 weekly timetables to organize your study schedule.',
            icon: Calendar,
            color: 'from-purple-500 to-purple-600',
            features: [
                'Weekly schedule planning',
                'Subject-wise time allocation',
                'Multiple timetable support',
                'Calendar integration',
            ],
        },
        {
            title: 'Study Chat Rooms',
            description: 'Connect with up to 5 study partners for motivation and support.',
            icon: MessageCircle,
            color: 'from-pink-500 to-pink-600',
            features: [
                'Real-time chat with study partners',
                'Share progress and motivation',
                'Photo sharing support',
                'Room-based organization',
            ],
        },
        {
            title: 'Rankings & Competition',
            description: 'See how you rank against other learners and stay motivated.',
            icon: Trophy,
            color: 'from-yellow-500 to-yellow-600',
            features: [
                'Daily study hour rankings',
                'Overall progress leaderboards',
                'Streak competitions',
                'Achievement tracking',
            ],
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTutorial();
            onComplete();
        }
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quick Tour</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Learn the basics in just a few minutes</p>
                    </div>
                    <button
                        onClick={skipTutorial}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Step {currentStep + 1} of {steps.length}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {Math.round(((currentStep + 1) / steps.length) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                            className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full"
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
                        className="mb-8"
                    >
                        <div className="text-center mb-6">
                            <div
                                className={`w-20 h-20 bg-gradient-to-br ${steps[currentStep].color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                            >
                                {'<'} steps[currentStep].icon className="text-white" size={40} {'/>'}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{steps[currentStep].title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{steps[currentStep].description}</p>
                        </div>

                        <div className="space-y-3">
                            {steps[currentStep].features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                                >
                                    <div
                                        className={`w-6 h-6 bg-gradient-to-br ${steps[currentStep].color} rounded-full flex items-center justify-center flex-shrink-0`}
                                    >
                                        <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                    </motion.button>

                    <div className="flex space-x-2">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentStep ? 'bg-primary-600 w-6' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-xl font-medium"
                    >
                        <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                        {currentStep < steps.length - 1 && <ChevronRight size={16} />}
                    </motion.button>
                </div>

                {/* Skip Button */}
                <div className="text-center mt-6">
                    <button
                        onClick={skipTutorial}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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