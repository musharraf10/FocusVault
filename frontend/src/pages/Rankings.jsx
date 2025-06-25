import { useEffect, useState } from "react";
import { Trophy, ChevronLeft, ChevronRight, Medal, Crown, ArrowLeft } from "lucide-react";
import PropTypes from "prop-types";
import axios from "axios";
import toast from "react-hot-toast";

const Rankings = ({ user }) => {
    const [rankings, setRankings] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchRankings();
    }, [page]);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/study/rankings?page=${page}&limit=10`);
            setRankings(res.data.data || []);
            setTotalPages(Math.ceil(res.data.total / 10));
        } catch (err) {
            toast.error("Failed to load rankings");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0s';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const getCurrentUserRank = () => {
        const allSorted = [...rankings].sort((a, b) => {
            if (b.totalStudyHours === a.totalStudyHours) {
                return b.currentStreak - a.currentStreak;
            }
            return b.totalStudyHours - a.totalStudyHours;
        });
        const index = allSorted.findIndex(r => r.userId === user?._id);
        return index !== -1 ? index + 1 : '—';
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Crown className="text-yellow-400" />;
            case 2: return <Medal className="text-gray-400" />;
            case 3: return <Medal className="text-amber-600" />;
            default: return <span className="font-semibold text-gray-600 dark:text-gray-300">#{rank}</span>;
        }
    };

    const onBack = () => {
        window.history.back();
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md active:transform active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">Back</span>
                    </button>
                </div>

                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="text-white" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-blue-900 dark:text-white mb-2">Leaderboard</h1>
                <p className="text-gray-600 dark:text-gray-300">Based on total study hours</p>
            </div>

            {user && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 rounded-2xl shadow">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                                {user.profileImage ? (
                                    <img src={user.profileImage} className="w-full h-full rounded-xl" />
                                ) : (
                                    <span>{user.name?.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-xs">Your Rank: #{getCurrentUserRank()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold">{formatTime(rankings.find(r => r.userId === user?._id)?.totalStudyHours)}</p>
                            <p className="text-sm">Streak: {rankings.find(r => r.userId === user?._id)?.currentStreak || 0} days</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-white">Top Learners</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => page > 1 && setPage(page - 1)} disabled={page === 1}>
                            <ChevronLeft className="text-gray-500" />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {page}</span>
                        <button onClick={() => page < totalPages && setPage(page + 1)} disabled={page === totalPages}>
                            <ChevronRight className="text-gray-500" />
                        </button>
                    </div>
                </div>
                <div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : rankings.length > 0 ? (
                        rankings.map((item, index) => {
                            const rank = (page - 1) * 10 + index + 1;
                            const isMe = item.userId === user?._id;
                            return (
                                <div key={item.userId} className={`p-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 ${isMe ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                            {getRankIcon(rank)}
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-xl overflow-hidden">
                                                {item.profileImage ? (
                                                    <img src={item.profileImage} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-xl">{item.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${isMe ? 'text-blue-600' : 'text-gray-800 dark:text-white'}`}>{item.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Streak: {item.currentStreak || 0} days</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-right font-semibold ${isMe ? 'text-blue-600' : 'text-gray-800 dark:text-white'}`}>
                                        {formatTime(item.totalStudyHours)}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-gray-500">No rankings available</div>
                    )}
                </div>
            </div>
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
