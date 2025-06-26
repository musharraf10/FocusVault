import { motion } from "framer-motion";
import { BookOpen, Timer, Target, CheckCircle, Download, RefreshCw, ChevronUp } from "lucide-react";

const SessionsList = ({ paginatedSessions, viewMode, currentPage, setCurrentPage, totalPages, filteredSessions, itemsPerPage }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Study Sessions ({filteredSessions.length})
            </h3>
            <div className="flex items-center space-x-2">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                    <Download size={18} />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <RefreshCw size={18} />
                </motion.button>
            </div>
        </div>
        <div
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
        >
            {paginatedSessions.map((session) => {
                const efficiency = session.targetTime > 0 ? (session.actualTime / session.targetTime) * 100 : 0;
                const efficiencyColor =
                    efficiency > 100 ? "text-green-600" : efficiency > 80 ? "text-yellow-600" : "text-red-600";
                const efficiencyBg =
                    efficiency > 100 ? "bg-green-50 dark:bg-green-900/20" : efficiency > 80 ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-red-50 dark:bg-red-900/20";

                return (
                    <motion.div
                        key={session._id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 border border-gray-200 dark:border-gray-700 rounded-xl ${efficiencyBg} ${viewMode === "list" ? "flex items-center justify-between" : ""
                            }`}
                    >
                        <div className={viewMode === "list" ? "flex items-center space-x-4" : "space-y-3"}>
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${efficiency > 100 ? "bg-green-100 dark:bg-green-800" : efficiency > 80 ? "bg-yellow-100 dark:bg-yellow-800" : "bg-red-100 dark:bg-red-800"
                                    }`}
                            >
                                <BookOpen className={efficiencyColor} size={20} />
                            </div>
                            <div className={viewMode === "list" ? "" : "space-y-2"}>
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-800 dark:text-white">{session.subject}</h4>
                                    {session.completed && <CheckCircle className="text-green-500" size={16} />}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center space-x-1">
                                        <Timer size={14} />
                                        <span>{Math.round(session.actualTime / 60)}h {session.actualTime % 60}m</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Target size={14} />
                                        <span>{Math.round(session.targetTime / 60)}m</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(session.startTime).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                    <span className={`text-sm font-medium ${efficiencyColor}`}>
                                        {Math.round(efficiency)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
        {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} sessions
                </div>
                <div className="flex items-center space-x-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronUp className="rotate-[-90deg]" size={16} />
                    </motion.button>
                    <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <motion.button
                                    key={pageNum}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium ${currentPage === pageNum
                                        ? "bg-primary-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                        }`}
                                >
                                    {pageNum}
                                </motion.button>
                            );
                        })}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronUp className="rotate-90" size={16} />
                    </motion.button>
                </div>
            </div>
        )}
    </div>
);

export default SessionsList;