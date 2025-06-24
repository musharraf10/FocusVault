// src/pages/Rankings.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Flame, Users, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { fetchCompletedSubjects, fetchSessionStats } from "../services/apiServices";

const Rankings = ({ user }) => {

    const [rankings, setRankings] = useState({
        todayStudyHours: [],
        overallStudyHours: [],
        currentStreak: [],
    });
    const [activeTab, setActiveTab] = useState('todayStudyHours');
    const [loading, setLoading] = useState(true);

    const tabs = [
        {
            id: 'todayStudyHours',
            label: "Today's Hours",
            icon: Clock,
            color: 'from-blue-500 to-blue-600',
        },
        {
            id: 'overallStudyHours',
            label: 'Total Hours',
            icon: Trophy,
            color: 'from-yellow-500 to-yellow-600',
        },
        {
            id: 'currentStreak',
            label: 'Current Streak',
            icon: Flame,
            color: 'from-red-500 to-red-600',
        },
    ];

    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            const studyContent = await fetchStudyContent(); // Fetch study session data
            const computedRankings = computeRankings(studyContent);
            setRankings(computedRankings);
        } catch (error) {
            toast.error('Failed to load rankings. Please try again.');
            console.error('Failed to fetch study content:', error);
        } finally {
            setLoading(false);
        }
    };

    const computeRankings = (studyContent) => {
        // Aggregate data by user
        const userData = studyContent.reduce((acc, session) => {
            const { userId, name, profileImage, startTime, duration } = session;
            if (!acc[userId]) {
                acc[userId] = { userId, name, profileImage, sessions: [] };
            }
            acc[userId].sessions.push({ startTime: new Date(startTime), duration });
            return acc;
        }, {});

        // Calculate rankings
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

        const userRankings = Object.values(userData).map(({ userId, name, profileImage, sessions }) => {
            // Total Study Hours
            const totalStudyHours = sessions.reduce((sum, session) => sum + session.duration, 0);

            // Today's Study Hours
            const todayStudyHours = sessions
                .filter((session) => session.startTime >= today && session.startTime < tomorrow)
                .reduce((sum, session) => sum + session.duration, 0);

            // Current Streak
            const sortedDates = sessions
                .map((session) => {
                    const date = new Date(session.startTime);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime();
                })
                .filter((time, index, self) => self.indexOf(time) === index) // Unique days
                .sort((a, b) => b - a); // Descending order

            let currentStreak = 0;
            const todayTime = today.getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;

            if (sortedDates.length > 0) {
                // Check if today or yesterday has a session
                const latestDay = sortedDates[0];
                if (latestDay === todayTime || latestDay === todayTime - oneDayMs) {
                    for (let i = 0; i < sortedDates.length; i++) {
                        const expectedDay = todayTime - (latestDay === todayTime ? i : i + 1) * oneDayMs;
                        if (sortedDates[i] === expectedDay) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    }
                }
            }

            return {
                userId,
                name: name || 'Unknown',
                profileImage,
                totalStudyHours,
                todayStudyHours,
                currentStreak,
            };
        });

        // Sort rankings for each category
        return {
            todayStudyHours: [...userRankings]
                .sort((a, b) => b.todayStudyHours - a.todayStudyHours)
                .map(({ userId, name, profileImage, todayStudyHours }) => ({
                    userId,
                    name,
                    profileImage,
                    value: todayStudyHours,
                })),
            overallStudyHours: [...userRankings]
                .sort((a, b) => b.totalStudyHours - a.totalStudyHours)
                .map(({ userId, name, profileImage, totalStudyHours }) => ({
                    userId,
                    name,
                    profileImage,
                    value: totalStudyHours,
                })),
            currentStreak: [...userRankings]
                .sort((a, b) => b.currentStreak - a.currentStreak)
                .map(({ userId, name, profileImage, currentStreak }) => ({
                    userId,
                    name,
                    profileImage,
                    value: currentStreak,
                })),
        };
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${mins}m`;
        }
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Crown className="text-yellow-500" size={24} />;
            case 2:
                return <Medal className="text-gray-400" size={24} />;
            case 3:
                return <Medal className="text-amber-600" size={24} />;
            default:
                return <span className="text-lg font-bold text-gray-600 dark:text-gray-300">#{rank}</span>;
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
        if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
        if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white';
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    };

    const getValueDisplay = (value, type) => {
        if (!value) return '—';
        switch (type) {
            case 'todayStudyHours':
            case 'overallStudyHours':
                return formatTime(value);
            case 'currentStreak':
                return `${value} days`;
            default:
                return value;
        }
    };

    const getCurrentUserRank = () => {
        const currentRankings = rankings[activeTab] || [];
        const userIndex = currentRankings.findIndex((item) => item.userId === user?._id);
        return userIndex !== -1 ? userIndex + 1 : null;
    };

    const getCurrentUserValue = () => {
        const currentRankings = rankings[activeTab] || [];
        const userItem = currentRankings.find((item) => item.userId === user?._id);
        return userItem ? userItem.value : 0;
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Rankings</h1>
                    <p className="text-gray-600 dark:text-gray-300">Loading rankings...</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Rankings</h1>
                <p className="text-gray-600 dark:text-gray-300">See how you stack up against other learners</p>
            </motion.div>

            {/* User's Current Rank */}
            {user && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-lg">{user.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Your Rank</h3>
                                <p className="text-primary-100 text-sm">{tabs.find((tab) => tab.id === activeTab)?.label}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">#{getCurrentUserRank() || '—'}</div>
                            <div className="text-primary-100 text-sm">{getValueDisplay(getCurrentUserValue(), activeTab)}</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="overflow-x-auto">
                <div className="flex space-x-2 pb-2 min-w-max">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <tab.icon size={16} />
                            <span className="text-sm">{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Rankings List */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                        <TrendingUp size={20} />
                        <span>{tabs.find((tab) => tab.id === activeTab)?.label} Leaderboard</span>
                    </h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rankings[activeTab]?.length > 0 ? (
                        rankings[activeTab].slice(0, 50).map((item, index) => {
                            const rank = index + 1;
                            const isCurrentUser = item.userId === user?._id;

                            return (
                                <motion.div
                                    key={item.userId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isCurrentUser ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getRankBadge(rank)}`}>
                                            {getRankIcon(rank)}
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                                {item.profileImage ? (
                                                    <img
                                                        src={item.profileImage}
                                                        alt={item.name}
                                                        className="w-full h-full rounded-xl object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-white font-bold text-sm">{item.name?.charAt(0) || 'U'}</span>
                                                )}
                                            </div>

                                            <div>
                                                <h4
                                                    className={`font-medium ${isCurrentUser ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-white'
                                                        }`}
                                                >
                                                    {item.name}
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-2 py-1 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">Rank #{rank}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div
                                            className={`text-lg font-bold ${isCurrentUser ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-white'
                                                }`}
                                        >
                                            {getValueDisplay(item.value, activeTab)}
                                        </div>
                                        {rank <= 3 && (
                                            <div className="flex items-center justify-end space-x-1 mt-1">
                                                <Star className="text-yellow-500" size={12} />
                                                <span className="text-xs text-yellow-600 font-medium">Top {rank}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="p-12 text-center">
                            <Users className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-500 dark:text-gray-400">No rankings available yet</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Start studying to appear on the leaderboard!
                            </p>
                        </div>
                    )}
                </div>

                {rankings[activeTab]?.length > 50 && (
                    <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Showing top 50 users</p>
                    </div>
                )}
            </motion.div>

            {/* Stats Summary */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-3 gap-4"
            >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Users className="text-white" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{rankings[activeTab]?.length || 0}</p>
                    <p className="text-xs text-blue-600 font-medium">Total Users</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="text-white" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        {rankings[activeTab]?.[0] ? getValueDisplay(rankings[activeTab][0].value, activeTab) : '—'}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Top Score</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Star className="text-white" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">#{getCurrentUserRank() || '—'}</p>
                    <p className="text-xs text-purple-600 font-medium">Your Rank</p>
                </div>
            </motion.div>
        </div>
    );
};

Rankings.propTypes = {
    user: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        profileImage: PropTypes.string,
    }),
};

export default Rankings;