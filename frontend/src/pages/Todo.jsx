import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Edit2, Trash2, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    category: 'general'
  });
  const [buttonLoading, setButtonLoading] = useState({
    add: false,
    edit: false,
    toggle: {},
    delete: {}
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const priorities = [
    { value: 'low', label: 'Low', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { value: 'medium', label: 'Medium', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { value: 'high', label: 'High', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' }
  ];

  const categories = ['general', 'study', 'personal', 'work', 'health'];

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/todo`);
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) {
      toast.error('Please enter a todo title');
      return;
    }

    try {
      setButtonLoading(prev => ({ ...prev, add: true }));
      const response = await axios.post(`${API_URL}/api/todo`, newTodo);
      setTodos([response.data, ...todos]);
      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '', category: 'general' });
      setIsAddingTodo(false);
      toast.success('Todo added successfully!');
    } catch (error) {
      toast.error('Failed to add todo');
    } finally {
      setButtonLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleToggleTodo = async (id, completed) => {
    try {
      setButtonLoading(prev => ({ ...prev, toggle: { ...prev.toggle, [id]: true } }));
      const response = await axios.put(`${API_URL}/api/todo/${id}`, { completed: !completed });
      setTodos(todos.map(todo => todo._id === id ? response.data : todo));
      toast.success(completed ? 'Todo marked as incomplete' : 'Todo completed!');
    } catch (error) {
      toast.error('Failed to update todo');
    } finally {
      setButtonLoading(prev => ({ ...prev, toggle: { ...prev.toggle, [id]: false } }));
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      setButtonLoading(prev => ({ ...prev, delete: { ...prev.delete, [id]: true } }));
      await axios.delete(`${API_URL}/api/todo/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
      toast.success('Todo deleted');
    } catch (error) {
      toast.error('Failed to delete todo');
    } finally {
      setButtonLoading(prev => ({ ...prev, delete: { ...prev.delete, [id]: false } }));
    }
  };

  const handleEditTodo = async () => {
    if (!editingTodo.title.trim()) {
      toast.error('Please enter a todo title');
      return;
    }

    try {
      setButtonLoading(prev => ({ ...prev, edit: true }));
      const response = await axios.put(`${API_URL}/api/todo/${editingTodo._id}`, editingTodo);
      setTodos(todos.map(todo => todo._id === editingTodo._id ? response.data : todo));
      setEditingTodo(null);
      toast.success('Todo updated successfully!');
    } catch (error) {
      toast.error('Failed to update todo');
    } finally {
      setButtonLoading(prev => ({ ...prev, edit: false }));
    }
  };

  const getPriorityConfig = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed;
    return true;
  });

  const completedCount = todos.filter(todo => todo.completed).length;
  const completionPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !todos.find(t => t.dueDate === dueDate)?.completed;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Todo List
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Stay organized and productive
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 text-center"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Circle className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold text-blue-600">{todos.length}</p>
          <p className="text-xs text-blue-600 font-medium">Total</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 text-center"
        >
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          <p className="text-xs text-green-600 font-medium">Completed</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 text-center"
        >
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="text-white" size={20} />
          </div>
          <p className="text-2xl font-bold text-purple-600">{completionPercentage}%</p>
          <p className="text-xs text-purple-600 font-medium">Progress</p>
        </motion.div>
      </div>

      {/* Add Todo Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsAddingTodo(true)}
        disabled={buttonLoading.add}
        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonLoading.add ? (
          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <>
            <Plus size={20} />
            <span>Add New Todo</span>
          </>
        )}
      </motion.button>

      {/* Add Todo Form */}
      <AnimatePresence>
        {isAddingTodo && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add New Todo</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Todo title..."
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />

              <textarea
                placeholder="Description (optional)..."
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newTodo.category}
                    onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddTodo}
                  disabled={buttonLoading.add}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buttonLoading.add ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
                  ) : (
                    'Add Todo'
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsAddingTodo(false);
                    setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '', category: 'general' });
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' }
        ].map((tab) => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === tab.key
              ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTodos.map((todo, index) => {
            const priorityConfig = getPriorityConfig(todo.priority);
            const overdue = isOverdue(todo.dueDate);

            return (
              <motion.div
                key={todo._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 ${todo.completed ? 'opacity-75' : ''
                  } ${overdue ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}
              >
                {editingTodo?._id === todo._id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingTodo.title}
                      onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                    <textarea
                      value={editingTodo.description}
                      onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                      rows={2}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                    />
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEditTodo}
                        disabled={buttonLoading.edit}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {buttonLoading.edit ? (
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
                        ) : (
                          'Save Changes'
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingTodo(null)}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleTodo(todo._id, todo.completed)}
                      disabled={buttonLoading.toggle[todo._id]}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${todo.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        } disabled:opacity-50`}
                    >
                      {buttonLoading.toggle[todo._id] ? (
                        <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full" />
                      ) : todo.completed ? (
                        <Check className="text-white" size={14} />
                      ) : null}
                    </motion.button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${todo.completed
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-800 dark:text-white'
                            }`}>
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p className={`text-sm mt-1 ${todo.completed
                              ? 'line-through text-gray-400 dark:text-gray-500'
                              : 'text-gray-600 dark:text-gray-300'
                              }`}>
                              {todo.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-3 mt-2">
                            <div className={`px-2 py-1 rounded-lg ${priorityConfig.bgColor}`}>
                              <span className={`text-xs font-medium bg-gradient-to-r ${priorityConfig.color} bg-clip-text text-transparent`}>
                                {priorityConfig.label}
                              </span>
                            </div>

                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {todo.category}
                            </span>

                            {todo.dueDate && (
                              <div className={`flex items-center space-x-1 text-xs ${overdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                <Clock size={12} />
                                <span>{format(new Date(todo.dueDate), 'MMM d')}</span>
                                {overdue && <span className="font-medium">(Overdue)</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingTodo(todo)}
                            className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTodo(todo._id)}
                            disabled={buttonLoading.delete[todo._id]}
                            className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {buttonLoading.delete[todo._id] ? (
                              <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTodos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <CheckCircle2 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'completed' ? 'No completed todos yet.' :
                filter === 'pending' ? 'No pending todos!' :
                  'No todos yet. Add your first task!'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Todo;