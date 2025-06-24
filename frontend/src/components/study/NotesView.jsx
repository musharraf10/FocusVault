import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, FileText, Pin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const NotesView = () => {
  const [notes, setNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({ title: '', body: '', tags: [], isPinned: false });
  const [tagInput, setTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const NOTES_PER_PAGE = 10;

  useEffect(() => {
    fetchNotes();
  }, [currentPage]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchNotes(searchTerm);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchNotes = async (query = '', page = currentPage) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/study/notes?search=${query}&page=${page}&limit=${NOTES_PER_PAGE}`);

      if (res.data.notes) {
        // Backend returns paginated response
        setNotes(res.data.notes);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.currentPage);
      } else {
        // Backend returns simple array (fallback)
        const sortedNotes = res.data.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setNotes(sortedNotes);
        setTotalCount(sortedNotes.length);
        setTotalPages(Math.ceil(sortedNotes.length / NOTES_PER_PAGE));
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (newNote.title.trim() && newNote.body.trim()) {
      try {
        const res = await axios.post(`${API_URL}/api/study/notes`, newNote);
        setNotes([res.data, ...notes]);
        setNewNote({ title: '', body: '', tags: [], isPinned: false });
        setTagInput('');
        setIsAddingNote(false);
        fetchNotes(); // Refresh to get updated pagination
      } catch (error) {
        console.error('Failed to add note:', error);
      }
    }
  };

  const handleEditNote = async () => {
    if (editingNote && editingNote.title.trim() && editingNote.body.trim()) {
      try {
        const res = await axios.put(`${API_URL}/api/study/notes/${editingNote._id}`, editingNote);
        setNotes(notes.map(n => (n._id === editingNote._id ? res.data : n)));
        setEditingNote(null);
        setEditTagInput('');
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`${API_URL}/api/study/notes/${id}`);
        setNotes(notes.filter(note => note._id !== id));
        fetchNotes(); // Refresh to get updated pagination
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const updatedNote = { ...note, isPinned: !note.isPinned };
      const res = await axios.put(`${API_URL}/api/study/notes/${note._id}`, updatedNote);
      setNotes(notes.map(n => (n._id === note._id ? res.data : n)));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleAddTag = (e, isEditing = false) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const tag = e.target.value.trim();
      if (isEditing) {
        if (!editingNote.tags.includes(tag)) {
          setEditingNote({
            ...editingNote,
            tags: [...editingNote.tags, tag]
          });
        }
        setEditTagInput('');
      } else {
        if (!newNote.tags.includes(tag)) {
          setNewNote({
            ...newNote,
            tags: [...newNote.tags, tag]
          });
        }
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove, isEditing = false) => {
    if (isEditing) {
      setEditingNote({
        ...editingNote,
        tags: editingNote.tags.filter(tag => tag !== tagToRemove)
      });
    } else {
      setNewNote({
        ...newNote,
        tags: newNote.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
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

  const toggleNoteExpansion = (noteId) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
    <div className="space-y-6">
      {/* Header with Search and Add */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
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
            onClick={() => setIsAddingNote(true)}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Note</span>
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

      {/* Add Note Form */}
      {isAddingNote && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add New Note</h4>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
            <textarea
              placeholder="Write your note here..."
              value={newNote.body}
              onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
              rows={6}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
            />

            {/* Tags Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (Press Enter to add)
              </label>
              <input
                type="text"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleAddTag(e)}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
              {newNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {newNote.tags.map((tag, index) => (
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

            {/* Pin Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="pinNote"
                checked={newNote.isPinned}
                onChange={(e) => setNewNote({ ...newNote, isPinned: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="pinNote" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                <Pin size={16} />
                <span>Pin this note</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddNote}
                className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium"
              >
                Save Note
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ title: '', body: '', tags: [], isPinned: false });
                  setTagInput('');
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Notes List */}
      {!loading && (
        <div className="space-y-4">
          {notes.map((note, index) => (
            <motion.div
              key={note._id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${note.isPinned
                ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/30 dark:from-yellow-900/20 dark:to-orange-900/10 shadow-yellow-100 dark:shadow-yellow-900/20'
                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                }`}
            >
              {editingNote?._id === note._id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                  <textarea
                    value={editingNote.body}
                    onChange={(e) => setEditingNote({ ...editingNote, body: e.target.value })}
                    rows={4}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                  />

                  {/* Edit Tags Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (Press Enter to add)
                    </label>
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => handleAddTag(e, true)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                    {editingNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {editingNote.tags.map((tag, index) => (
                          <span key={tag} className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getTagColor(index)} shadow-sm`}>
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag, true)}
                              className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Edit Pin Option */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="editPinNote"
                      checked={editingNote.isPinned}
                      onChange={(e) => setEditingNote({ ...editingNote, isPinned: e.target.checked })}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="editPinNote" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                      <Pin size={16} />
                      <span>Pin this note</span>
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditNote}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-xl font-medium"
                    >
                      Save Changes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setEditingNote(null);
                        setEditTagInput('');
                      }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getSubjectColor()} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">
                          {note.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                            {note.title}
                          </h4>
                          {note.isPinned && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-1.5 rounded-full shadow-sm">
                              <Pin className="text-white" size={14} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {format(new Date(note.createdAt), 'MMM d, yyyy • h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleTogglePin(note)}
                        className={`p-2.5 rounded-xl transition-all duration-200 ${note.isPinned
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          }`}
                      >
                        <Pin size={16} fill={note.isPinned ? 'currentColor' : 'none'} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingNote(note);
                          setEditTagInput('');
                        }}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                      >
                        <Edit size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Display Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag, index) => (
                        <span key={tag} className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getTagColor(index)} shadow-sm`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                      {expandedNotes.has(note._id) ? note.body : truncateText(note.body)}
                    </p>

                    {note.body.length > 150 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleNoteExpansion(note._id)}
                        className="mt-3 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center space-x-1 transition-colors"
                      >
                        <span>
                          {expandedNotes.has(note._id) ? 'Show less' : 'Read more'}
                        </span>
                        <motion.div
                          animate={{ rotate: expandedNotes.has(note._id) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}

          {notes.length === 0 && !loading && (
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

          {/* Pagination */}
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

export default NotesView;