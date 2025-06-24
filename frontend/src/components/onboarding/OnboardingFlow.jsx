// src/components/OnboardingFlow.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, User, Calendar, BookOpen, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingFlow = ({ onComplete, user }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        dateOfBirth: user?.dateOfBirth || '',
        profileImage: null,
        studyPreferences: user?.preferences || {
            defaultStudyTime: 60,
            preferredStudyTime: 'morning',
            studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        timetable: {
            name: 'My Study Schedule',
            description: 'Default weekly timetable',
            schedule: {
                monday: [{ time: '09:00', subject: 'Mathematics', duration: 60 }],
                tuesday: [{ time: '09:00', subject: 'Science', duration: 60 }],
                wednesday: [{ time: '09:00', subject: 'English', duration: 60 }],
                thursday: [{ time: '09:00', subject: 'History', duration: 60 }],
                friday: [{ time: '09:00', subject: 'Review', duration: 60 }],
                saturday: [],
                sunday: [],
            },
        },
    });

    const allSteps = [
        {
            id: 'profile',
            title: 'Personal Information',
            description: 'Tell us a bit about yourself',
            icon: User,
            isVisible: !onboardingStatus.isDOBSet || !onboardingStatus.isProfileImageSet,
        },
        {
            id: 'preferences',
            title: 'Study Preferences',
            description: 'Customize your study experience',
            icon: BookOpen,
            isVisible: !onboardingStatus.isPreferencesSet,
        },
        {
            id: 'timetable',
            title: 'Create Your Schedule',
            description: 'Set up your weekly study timetable',
            icon: Calendar,
            isVisible: !onboardingStatus.isTimetableSet,
        },
        {
            id: 'complete',
            title: 'All Set!',
            description: 'Your account is ready to use',
            icon: CheckCircle,
            isVisible: true, // Always show if any other step is visible
        },
    ];

    const steps = useMemo(() => {
        const visibleSteps = allSteps.filter((step) => step.isVisible);
        // Ensure 'complete' step is included only if other steps are present
        if (visibleSteps.length === 1 && visibleSteps[0].id === 'complete') {
            return [];
        }
        return visibleSteps;
    }, [onboardingStatus]);

    const studyTimes = [
        { value: 'morning', label: 'Morning (6AM - 12PM)' },
        { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
        { value: 'evening', label: 'Evening (6PM - 10PM)' },
        { value: 'night', label: 'Night (10PM - 2AM)' },
    ];

    const weekDays = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' },
    ];

    const handleNext = async () => {
        if (currentStep === steps.length - 2) {
            // Last step before completion - save all data
            try {
                if (steps[currentStep].id === 'profile') {
                    if (formData.dateOfBirth && !onboardingStatus.isDOBSet) {
                        await updateProfile({ dateOfBirth: formData.dateOfBirth });
                    }
                    if (formData.profileImage && !onboardingStatus.isProfileImageSet) {
                        await updateProfileImage(formData.profileImage);
                    }
                } else if (steps[currentStep].id === 'preferences') {
                    await updateProfile({ preferences: formData.studyPreferences });
                } else if (steps[currentStep].id === 'timetable') {
                    await saveTimetable({ ...formData.timetable, isActive: true });
                }
                setCurrentStep(currentStep + 1);
                toast.success('Step completed successfully!');
            } catch (error) {
                toast.error('Failed to save data. Please try again.');
                console.error('Onboarding error:', error);
                return;
            }
        } else if (steps[currentStep].id === 'complete') {
            // Complete onboarding
            onComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const updateFormData = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const updateNestedFormData = (parent, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    const handleStudyDayToggle = (day) => {
        const currentDays = formData.studyPreferences.studyDays;
        const updatedDays = currentDays.includes(day)
            ? currentDays.filter((d) => d !== day)
            : [...currentDays, day];

        updateNestedFormData('studyPreferences', 'studyDays', updatedDays);
    };

    const addTimetableSlot = (day) => {
        const currentSchedule = formData.timetable.schedule[day];
        const newSlot = { time: '09:00', subject: '', duration: 60 };

        setFormData((prev) => ({
            ...prev,
            timetable: {
                ...prev.timetable,
                schedule: {
                    ...prev.timetable.schedule,
                    [day]: [...currentSchedule, newSlot],
                },
            },
        }));
    };

    const updateTimetableSlot = (day, index, field, value) => {
        const currentSchedule = [...formData.timetable.schedule[day]];
        currentSchedule[index] = { ...currentSchedule[index], [field]: value };

        setFormData((prev) => ({
            ...prev,
            timetable: {
                ...prev.timetable,
                schedule: {
                    ...prev.timetable.schedule,
                    [day]: currentSchedule,
                },
            },
        }));
    };

    const removeTimetableSlot = (day, index) => {
        const currentSchedule = formData.timetable.schedule[day];
        if (currentSchedule.length <= 1) return;

        const updatedSchedule = currentSchedule.filter((_, i) => i !== index);

        setFormData((prev) => ({
            ...prev,
            timetable: {
                ...prev.timetable,
                schedule: {
                    ...prev.timetable.schedule,
                    [day]: updatedSchedule,
                },
            },
        }));
    };

    const canProceed = () => {
        switch (steps[currentStep]?.id) {
            case 'profile':
                return (!onboardingStatus.isDOBSet && formData.dateOfBirth) || (!onboardingStatus.isProfileImageSet && formData.profileImage);
            case 'preferences':
                return formData.studyPreferences.studyDays.length > 0;
            case 'timetable':
                return Object.values(formData.timetable.schedule).some((day) =>
                    day.some((slot) => slot.subject.trim())
                );
            case 'complete':
                return true;
            default:
                return true;
        }
    };

    const renderStepContent = () => {
        switch (steps[currentStep]?.id) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        {!onboardingStatus.isDOBSet && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        )}
                        {!onboardingStatus.isProfileImageSet && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Profile Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => updateFormData('profileImage', e.target.files[0])}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                                {formData.profileImage && (
                                    <img
                                        src={previewProfileImage(formData.profileImage)}
                                        alt="Profile Preview"
                                        className="mt-4 w-32 h-32 object-cover rounded-full"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'preferences':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Default Study Time (minutes)
                            </label>
                            <input
                                type="number"
                                value={formData.studyPreferences.defaultStudyTime}
                                onChange={(e) =>
                                    updateNestedFormData('studyPreferences', 'defaultStudyTime', parseInt(e.target.value))
                                }
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                min="15"
                                max="300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Preferred Study Time
                            </label>
                            <select
                                value={formData.studyPreferences.preferredStudyTime}
                                onChange={(e) =>
                                    updateNestedFormData('studyPreferences', 'preferredStudyTime', e.target.value)
                                }
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            >
                                {studyTimes.map((time) => (
                                    <option key={time.value} value={time.value}>
                                        {time.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Study Days
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {weekDays.map((day) => (
                                    <motion.button
                                        key={day.value}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleStudyDayToggle(day.value)}
                                        className={`p-3 rounded-xl text-sm font-medium transition-all ${formData.studyPreferences.studyDays.includes(day.value)
                                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        {day.label}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'timetable':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Timetable name..."
                                value={formData.timetable.name}
                                onChange={(e) => updateNestedFormData('timetable', 'name', e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            />

                            <div className="max-h-96 overflow-y-auto space-y-4">
                                {formData.studyPreferences.studyDays.map((day) => (
                                    <div key={day} className="space-y-3">
                                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize border-b border-gray-200 dark:border-gray-600 pb-1">
                                            {day}
                                        </h5>

                                        {formData.timetable.schedule[day].map((slot, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <input
                                                    type="time"
                                                    value={slot.time}
                                                    onChange={(e) => updateTimetableSlot(day, index, 'time', e.target.value)}
                                                    className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Subject"
                                                    value={slot.subject}
                                                    onChange={(e) => updateTimetableSlot(day, index, 'subject', e.target.value)}
                                                    className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={slot.duration}
                                                    onChange={(e) =>
                                                        updateTimetableSlot(day, index, 'duration', parseInt(e.target.value))
                                                    }
                                                    className="w-20 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                                                    min="15"
                                                    max="300"
                                                />
                                                {formData.timetable.schedule[day].length > 1 && (
                                                    <button
                                                        onClick={() => removeTimetableSlot(day, index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => addTimetableSlot(day)}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:border-primary-500 hover:text-primary-600 transition-colors text-sm"
                                        >
                                            + Add {day.charAt(0).toUpperCase() + day.slice(1)} Slot
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'complete':
                return (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="text-white" size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                Welcome to Focus Vault!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Your profile has been set up successfully. You're ready to start your learning journey!
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // If no steps are visible, complete onboarding immediately
    if (steps.length === 0) {
        onComplete();
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Setup Your Profile</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {currentStep + 1} of {steps.length}
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
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            {steps[currentStep].icon && (() => {
                                const Icon = steps[currentStep].icon;
                                return <Icon className="text-white" size={24} />;
                            })()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {steps[currentStep].description}
                            </p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        <span>Back</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>
                            {currentStep === steps.length - 2
                                ? 'Complete Setup'
                                : currentStep === steps.length - 1
                                    ? 'Get Started'
                                    : 'Next'}
                        </span>
                        {currentStep < steps.length - 1 && <ChevronRight size={16} />}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingFlow;