import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, time } from "framer-motion";
import {
    BarChart as RechartsBarChart, Bar, XAxis, YAxis, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend
} from "recharts";
import CountUp from 'react-countup';
import { BarChart3, Target, Activity, BookOpen, Calendar, PieChart, TrendingUp, Trophy, CheckCircle, Filter, Clock, Users, Lightbulb } from "lucide-react";
import { useStudy } from "../../context/StudyContext";
import Header from "./Header";
import QuoteCard from "./QuoteCard";
import StatsGrid from "./StatsGrid";
import ChartCard from "./ChartCard";
import SessionsList from "./SessionsList";
import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = ({ user }) => {
    const { studyData, fetchSessionStats, fetchDashboardAndTimetables } = useStudy();
    const [quote, setQuote] = useState({ text: "", author: "" });
    const [activeView, setActiveView] = useState("overview");
    const [dateRange, setDateRange] = useState("week");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [performanceFilter, setPerformanceFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [todaySessions, setTodaySessions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [detailedStats, setDetailedStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6", "#D946EF"];

    // Fetch data with caching
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await fetchDashboardAndTimetables();
                const stats = await fetchSessionStats(dateRange, selectedSubjects);
                setDetailedStats(stats);

                // Fetch enhanced analytics
                const analyticsResponse = await axios.get(`${API_URL}/api/study/analytics`, {
                    params: {
                        period: dateRange,
                        subject: selectedSubjects.length > 0 ? selectedSubjects[0] : undefined
                    }
                });
                setAnalytics(analyticsResponse.data);

                const todaySessionsRes = await axios.get(`${API_URL}/api/study/sessions/today`);
                setTodaySessions(todaySessionsRes.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        const cacheKey = `stats_${dateRange}_${selectedSubjects}`;
        const cachedStats = localStorage.getItem(cacheKey);
        if (cachedStats && !loading) {
            setDetailedStats(JSON.parse(cachedStats));
        }

        fetchData();
    }, [dateRange, selectedSubjects, fetchSessionStats, fetchDashboardAndTimetables]);

    // Cache stats
    useEffect(() => {
        if (detailedStats) {
            const cacheKey = `stats_${dateRange}_${selectedSubjects}`;
            localStorage.setItem(cacheKey, JSON.stringify(detailedStats));
        }
    }, [detailedStats, dateRange, selectedSubjects]);

    // Performance benchmarks
    const benchmarks = useMemo(() => {
        const sessions = studyData?.completedSubjects || [];
        const efficiency = sessions.map((s) => ({
            subject: s.subject,
            efficiency: s.targetTime > 0 ? (s.actualTime / s.targetTime) * 100 : 0,
            actualTime: s.actualTime,
            targetTime: s.targetTime,
        }));
        const avgEfficiency = efficiency.length > 0 ? efficiency.reduce((sum, e) => sum + e.efficiency, 0) / efficiency.length : 0;
        return {
            efficiency: avgEfficiency,
            totalTime: sessions.reduce((sum, s) => sum + s.actualTime, 0),
            completionRate: detailedStats?.summary.completionRate || 0,
            consistency: studyData?.currentStreak || 0,
            productivity: avgEfficiency > 100 ? "High" : avgEfficiency > 50 ? "Medium" : "Low",
        };
    }, [studyData, detailedStats]);

    const formatTime = (seconds) => {
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    const generateInsights = () => {
        if (!detailedStats || !studyData) return [];
        const insights = [];

        // Longest studied subject
        const longestSubject = subjectData.reduce(
            (max, curr) => (curr.value > max.value ? curr : max),
            subjectData[0] || { name: '', value: 0 }
        );
        if (longestSubject.value > 0) {
            insights.push(
                `🧠 You studied ${longestSubject.name} the longest (${formatTime(longestSubject.value)}). Great job!`
            );
        }

        // Low session day warning
        if (studyData.todayStats?.sessionCount < 2) {
            insights.push(`⚠️ Only ${studyData.todayStats?.sessionCount || 0} session today. Let’s bounce back!`);
        }

        // Most resumed subject
        const mostResumed = todaySessions.reduce(
            (max, curr) => (curr.resumedCount > max.resumedCount ? curr : max),
            todaySessions[0] || { subject: '', resumedCount: 0 }
        );
        if (mostResumed.resumedCount > 0) {
            insights.push(`🔁 Most resumed subject: ${mostResumed.subject} — try focusing earlier.`);
        }

        return insights.slice(0, 3);
    };

    // Filtered sessions
    const filteredSessions = useMemo(() => {
        let filtered = studyData?.completedSubjects || [];
        if (selectedSubjects.length > 0) {
            filtered = filtered.filter((s) => selectedSubjects.includes(s.subject));
        }
        if (searchQuery) {
            filtered = filtered.filter((s) => s.subject.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (performanceFilter !== "all") {
            filtered = filtered.filter((s) => {
                const efficiency = s.targetTime > 0 ? (s.actualTime / s.targetTime) * 100 : 0;
                switch (performanceFilter) {
                    case "overperformed":
                        return efficiency > 100;
                    case "ontrack":
                        return efficiency >= 80 && efficiency <= 120;
                    case "underperformed":
                        return efficiency < 80;
                    default:
                        return true;
                }
            });
        }
        return filtered;
    }, [studyData?.completedSubjects, selectedSubjects, searchQuery, performanceFilter]);

    // Pagination
    const paginatedSessions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSessions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSessions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

    // Unique subjects
    const uniqueSubjects = [...new Set((studyData?.completedSubjects || []).map((s) => s.subject))];

    // Chart data
    const subjectData = useMemo(() => {
        const grouped = {};
        let colorIndex = 0;
        (studyData?.completedSubjects || []).forEach((session) => {
            const subj = session.subject;
            if (!grouped[subj]) {
                grouped[subj] = {
                    name: subj,
                    value: 0,
                    sessions: 0,
                    color: colors[colorIndex % colors.length],
                };
                colorIndex++;
            }
            grouped[subj].value += session.actualTime || 0;
            grouped[subj].sessions += 1;
        });
        return Object.values(grouped);
    }, [studyData?.completedSubjects]);

    // Performance trend
    const performanceTrend = useMemo(() => {
        return (studyData?.completedSubjects || []).map((session, index) => ({
            session: index + 1,
            efficiency: session.targetTime > 0 ? (session.actualTime / session.targetTime) * 100 : 0,
            subject: session.subject,
            date: new Date(session.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }));
    }, [studyData?.completedSubjects]);

    // Radar chart data
    const radarData = useMemo(() => {
        const subjects = Object.keys(detailedStats?.subjectStats || {});
        return subjects.map((subject) => {
            const stats = detailedStats?.subjectStats[subject] || {};
            const avgTime = stats.totalTime / stats.sessions || 0;
            return {
                subject,
                consistency: Math.min((stats.sessions || 0) * 20, 100),
                efficiency: Math.min((avgTime / 60) * 10, 100),
                completion: ((stats.completed || 0) / (stats.sessions || 1)) * 100,
            };
        });
    }, [detailedStats?.subjectStats]);

    const views = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "performance", label: "Performance", icon: Target },
        { id: "sessions", label: "Sessions", icon: BookOpen },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <Header
                    user={user}
                />
                <QuoteCard quote={quote} setQuote={setQuote} />

                {/* Insight Box */}
                {generateInsights().length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 backdrop-blur-md"
                    >
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                            <Lightbulb size={20} />
                            <span>Smart Insights</span>
                        </h3>
                        <div className="space-y-3">
                            {generateInsights().map((insight, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                                >
                                    <p className="text-sm text-gray-800 dark:text-white">{insight}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex overflow-x-auto hide-scrollbar space-x-1 bg-white dark:bg-gray-800 rounded-2xl p-1 border border-gray-200 dark:border-gray-700"
                >
                    {views.map((view) => (
                        <motion.button
                            key={view.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveView(view.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeView === view.id
                                ? "bg-primary-600 text-white shadow-lg"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                        >
                            <view.icon size={18} />
                            <span>{view.label}</span>
                        </motion.button>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeView}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Overview tab */}
                        {activeView === "overview" && (
                            <div className="space-y-6">
                                <StatsGrid benchmarks={benchmarks} studyData={studyData} detailedStats={detailedStats} />
                                <ChartCard title="Weekly Progress" icon={Calendar}>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={studyData?.weeklyData || []}>
                                                <defs>
                                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                                <YAxis hide />
                                                <Tooltip />
                                                <Area type="monotone" dataKey="hours" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorGradient)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <ChartCard title="Time Distribution" icon={PieChart}>
                                        <div className="h-80 px-2 pb-4">
                                            {subjectData && subjectData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={subjectData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                            isAnimationActive={true}
                                                        >
                                                            {subjectData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ fontSize: '14px', borderRadius: '8px' }}
                                                            formatter={(value, name) => [`${formatTime(value)} mins`, name]}
                                                            labelStyle={{ color: '#374151', fontWeight: 500 }}
                                                        />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                                    No data available for Time Distribution
                                                </div>
                                            )}
                                        </div>
                                    </ChartCard>

                                    <ChartCard title="Subject Rankings" icon={BarChart3}>
                                        {subjectData && subjectData.length > 0 ? (
                                            <div className="space-y-3">
                                                {subjectData
                                                    .sort((a, b) => b.value - a.value)
                                                    .map((subject, index) => (
                                                        <div key={subject.name} className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium">
                                                                    {index + 1}
                                                                </div>
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: subject.color }}
                                                                />
                                                                <span className="font-medium text-gray-800 dark:text-white">
                                                                    {subject.name}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-medium text-gray-800 dark:text-white">
                                                                    {formatTime(subject.value)}m
                                                                </div>
                                                                <div className="text-sm text-gray-500">{subject.sessions} sessions</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No subjects ranked yet
                                            </div>
                                        )}
                                    </ChartCard>
                                </div>
                            </div>
                        )}

                        {/* Study analytics */}
                        {activeView === "analytics" && analytics && (
                            <div className="space-y-6">
                                {/* Enhanced Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 text-center"
                                    >
                                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <Clock className="text-white" size={20} />
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600">{(analytics.userStats.totalStudyHours)}m</p>
                                        <p className="text-xs text-blue-600 font-medium">Total Hours</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 text-center"
                                    >
                                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <BookOpen className="text-white" size={20} />
                                        </div>
                                        <p className="text-2xl font-bold text-green-600">{analytics.userStats.totalSessions}</p>
                                        <p className="text-xs text-green-600 font-medium">Total Sessions</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 text-center"
                                    >
                                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <Users className="text-white" size={20} />
                                        </div>
                                        <p className="text-2xl font-bold text-purple-600">{analytics.userStats.subjectsStudied.length}</p>
                                        <p className="text-xs text-purple-600 font-medium">Subjects</p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-4 text-center"
                                    >
                                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <Trophy className="text-white" size={20} />
                                        </div>
                                        <p className="text-2xl font-bold text-orange-600">{analytics.userStats.highestStreak}</p>
                                        <p className="text-xs text-orange-600 font-medium">Highest Streak</p>
                                    </motion.div>
                                </div>
                                {/* study analytics */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 backdrop-blur-md"
                                >
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                                        <BarChart3 size={20} />
                                        <span>Study Analytics</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <div className="flex space-x-2">
                                            {['week', 'month', 'year'].map((period) => (
                                                <motion.button
                                                    key={period}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setdateRange(period)}
                                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${dateRange === period
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                                </motion.button>
                                            ))}
                                        </div>
                                        {uniqueSubjects.length > 0 && (
                                            <select
                                                value={selectedSubjects}
                                                onChange={(e) => setSelectedSubjects(e.target.value)}
                                                className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none"
                                            >
                                                <option value="">All Subjects</option>
                                                {uniqueSubjects.map((subject) => (
                                                    <option key={subject} value={subject}>{subject}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    {detailedStats && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-primary-600">
                                                    <CountUp end={detailedStats.summary.totalSessions} duration={2} />
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">Total Sessions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-blue-600">
                                                    <CountUp end={Math.round(detailedStats.summary.totalStudyTime / 60)} duration={2} />m
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">Study Time</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-green-600">
                                                    <CountUp end={Math.round(detailedStats.summary.completionRate)} duration={2} />%
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">Completion</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-orange-600">
                                                    <CountUp end={Math.round(detailedStats.summary.averageSessionTime / 60)} duration={2} />m
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">Avg Session</div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Daily Progress Chart */}
                                <ChartCard title="Daily Study Progress" icon={TrendingUp}>
                                    {detailedStats?.dailyStats?.length > 0 ? (
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={detailedStats.dailyStats}>
                                                    <defs>
                                                        <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    />
                                                    <YAxis hide />
                                                    <Tooltip
                                                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                        formatter={(value, name) => [
                                                            name === 'totalTime' ? `${Math.round(value / 60)} minutes` : value,
                                                            name === 'totalTime' ? 'Study Time' : 'Sessions'
                                                        ]}
                                                    />
                                                    <Area type="monotone" dataKey="totalTime" stroke="#10B981" fillOpacity={1} fill="url(#dailyGradient)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-300 text-center py-8">No daily data available</p>
                                    )}
                                </ChartCard>
                            </div>
                        )}

                        {/* Performance View */}
                        {activeView === "performance" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white">Efficiency Score</h3>
                                            <div
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${benchmarks.efficiency > 100 ? "bg-green-100 text-green-800" :
                                                    benchmarks.efficiency > 80 ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {benchmarks.productivity}
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{Math.round(benchmarks.efficiency)}%</div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-primary-500 to-blue-500 h-2 rounded-full"
                                                style={{ width: `${Math.min(benchmarks.efficiency, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Completion Rate</h3>
                                        <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{Math.round(benchmarks.completionRate)}%</div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span>{detailedStats?.summary.completedSessions || 0} completed</span>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                                        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Consistency</h3>
                                        <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{benchmarks.consistency} days</div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                            <Trophy size={16} className="text-yellow-500" />
                                            <span>Best: {studyData?.highestStreak || 0} days</span>
                                        </div>
                                    </div>
                                </div>
                                <ChartCard title="Performance Trends">
                                    <div className="h-64">
                                        {performanceTrend && performanceTrend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={performanceTrend}>
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="efficiency"
                                                        stroke="#8B5CF6"
                                                        strokeWidth={2}
                                                        dot={{ fill: "#8B5CF6" }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                                No performance data available
                                            </div>
                                        )}
                                    </div>
                                </ChartCard>

                                {radarData.length > 0 && (
                                    <ChartCard title="Subject Analysis">
                                        <div className="h-72 px-4 pb-6">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={radarData} outerRadius="80%">
                                                    <PolarGrid />
                                                    <PolarAngleAxis
                                                        dataKey="subject"
                                                        tick={{ fontSize: 12, dy: 4 }}
                                                    />
                                                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                                    <Radar
                                                        name="Consistency"
                                                        dataKey="consistency"
                                                        stroke="#8B5CF6"
                                                        fill="#8B5CF6"
                                                        fillOpacity={0.2}
                                                    />
                                                    <Radar
                                                        name="Efficiency"
                                                        dataKey="efficiency"
                                                        stroke="#3B82F6"
                                                        fill="#3B82F6"
                                                        fillOpacity={0.2}
                                                    />
                                                    <Radar
                                                        name="Completion"
                                                        dataKey="completion"
                                                        stroke="#10B981"
                                                        fill="#10B981"
                                                        fillOpacity={0.2}
                                                    />
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{ bottom: -20 }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </ChartCard>
                                )}
                            </div>
                        )}

                        {/* Session Component */}
                        {activeView === "sessions" && (
                            <SessionsList
                                paginatedSessions={paginatedSessions}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                totalPages={totalPages}
                                filteredSessions={filteredSessions}
                                itemsPerPage={itemsPerPage}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Home;