import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, FileText, Pin, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const NotesView = () => {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({ edit: false, delete: {}, pin: {} });
  const [totalCount, setTotalCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const NOTES_PER_PAGE = 10;

  const fetchNotes = async (query = '', page = currentPage) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/study/notes?search=${query}&page=${page}&limit=${NOTES_PER_PAGE}`);

      if (res.data.notes) {
        const sortedNotes = res.data.notes.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setNotes(sortedNotes);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.currentPage);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentPage]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1);
      fetchNotes(searchTerm);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleEditNote = async () => {
    if (editingNote && editingNote.title.trim() && editingNote.body.trim()) {
      try {
        setButtonLoading(prev => ({ ...prev, edit: true }));
        if (editingNote._id) {
          // Update existing note
          const updatedData = { title: editingNote.title, body: editingNote.body, tags: editingNote.tags };
          const res = await axios.put(`${API_URL}/api/study/notes/${editingNote._id}`, updatedData);
          setNotes(notes.map(n => (n._id === editingNote._id ? res.data : n)));
        } else {
          // Create new note
          const res = await axios.post(`${API_URL}/api/study/notes`, editingNote);
          setNotes([res.data, ...notes]);
        }
        setEditingNote(null);
        setTagInput('');
        await fetchNotes();
      } catch (error) {
        console.error('Failed to save note:', error);
      } finally {
        setButtonLoading(prev => ({ ...prev, edit: false }));
      }
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setButtonLoading(prev => ({ ...prev, delete: { ...prev.delete, [id]: true } }));
        await axios.delete(`${API_URL}/api/study/notes/${id}`);
        setNotes(notes.filter(note => note._id !== id));
        await fetchNotes();
      } catch (error) {
        console.error('Failed to delete note:', error);
      } finally {
        setButtonLoading(prev => ({ ...prev, delete: { ...prev.delete, [id]: false } }));
      }
    }
  };

  const handleTogglePin = async (note) => {
    try {
      setButtonLoading(prev => ({ ...prev, pin: { ...prev.pin, [note._id]: true } }));
      const updatedNote = { ...note, isPinned: !note.isPinned };
      console.log('Toggling pin for note:', updatedNote);

      const res = await axios.put(`${API_URL}/api/study/notes/${note._id}`, { isPinned: updatedNote.isPinned });
      console.log('API Response:', res.data);

      setNotes(prevNotes => prevNotes.map(n =>
        n._id === note._id ? { ...n, ...res.data } : n
      ));

      if (editingNote && editingNote._id === note._id) {
        setEditingNote(prev => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    } finally {
      setButtonLoading(prev => ({ ...prev, pin: { ...prev.pin, [note._id]: false } }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const tag = e.target.value.trim();
      if (!editingNote.tags.includes(tag)) {
        setEditingNote({
          ...editingNote,
          tags: [...editingNote.tags, tag]
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditingNote({
      ...editingNote,
      tags: editingNote.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const getSubjectColor = () => 'from-purple-500 to-pink-500';

  const getTagColor = (index) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-red-400 to-red-600',
    ];
    return colors[index % colors.length];
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6 px-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Showing {((currentPage - 1) * NOTES_PER_PAGE) + 1} to {Math.min(currentPage * NOTES_PER_PAGE, totalCount)} of {totalCount} notes
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </motion.button>
          {startPage > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                1
              </motion.button>
              {startPage > 2 && <span className="text-gray-400">...</span>}
            </>
          )}
          {pages.map(page => (
            <motion.button
              key={page}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-lg font-medium ${page === currentPage
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
            >
              {page}
            </motion.button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {totalPages}
              </motion.button>
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AnimatePresence mode="wait">
        {editingNote ? (
          <motion.div
            key="edit-mode"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 bg-white dark:bg-gray-800 z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  handleEditNote();
                  setEditingNote(null);
                  setTagInput('');
                }}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300"
              >
                <ArrowLeft size={24} />
              </motion.button>
              <div className="flex items-center space-x-2">
                {editingNote._id && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { handleDeleteNote(editingNote._id); setEditingNote(null); setTagInput(''); }}
                    disabled={buttonLoading.delete[editingNote._id]}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {buttonLoading.delete[editingNote._id] ? (
                      <div className="animate-spin w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleTogglePin(editingNote)}
                  disabled={buttonLoading.pin[editingNote._id]}
                  className={`p-2 rounded-full ${editingNote.isPinned
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                    : 'text-gray-400 hover:text-yellow-500'
                    }`}
                >
                  {buttonLoading.pin[editingNote._id] ? (
                    <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full" />
                  ) : (
                    <Pin size={20} fill={editingNote.isPinned ? 'currentColor' : 'none'} />
                  )}
                </motion.button>
              </div>
            </div>

            <input
              type="text"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              className="w-full p-3 text-xl font-bold border-b border-gray-200 dark:border-gray-600 bg-transparent focus:ring-0 text-gray-800 dark:text-white focus:outline-none border-none mb-4"
              placeholder="Note title..."
            />
            <textarea
              value={editingNote.body}
              onChange={(e) => setEditingNote({ ...editingNote, body: e.target.value })}
              className="w-full p-3 text-gray-600 dark:text-gray-300 bg-transparent focus:outline-none border-none focus:ring-0 resize-none min-h-[60vh]"
              placeholder="Write your note here..."
            />

            <div className="mt-4">
              <input
                type="text"
                placeholder="Add a tag (Press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleAddTag(e)}
                className="w-full p-3 border-t border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white focus:outline-none"
              />
              {editingNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editingNote.tags.map((tag, index) => (
                    <span key={tag} className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getTagColor(index)} shadow-sm`}>
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 md:p-6 max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                  <FileText className="text-primary-600" size={20} />
                  <span>Study Notes</span>
                  {totalCount > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({totalCount})
                    </span>
                  )}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingNote({ title: '', body: '', tags: [], isPinned: false })}
                  disabled={buttonLoading.edit}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {buttonLoading.edit ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Add Note</span>
                    </>
                  )}
                </motion.button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
            </motion.div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            )}

            {!loading && (
              <div className="space-y-4">
                {notes.map((note, index) => (
                  <motion.div
                    key={note._id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => setEditingNote(note)}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg cursor-pointer border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    {/* Pin icon in top-right */}
                    {note.isPinned && (
                      <div className="absolute top-3 right-3 p-1 rounded-full bg-transparent">
                        <Pin className="w-5 h-5 text-black dark:text-white" fill="currentColor" />
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                            {note.title}
                          </h4>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {format(new Date(note.createdAt), 'MMM d, yyyy • h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 my-4">
                        {note.tags.map((tag, index) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getTagColor(index)} shadow-sm`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                      {note.body.substring(0, 150) + (note.body.length > 150 ? '...' : '')}
                    </p>
                  </motion.div>
                ))}

                {notes.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No notes found matching your search.' : 'No notes yet. Create your first study note!'}
                    </p>
                  </motion.div>
                )}
                {renderPagination()}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesView;