import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, AlertCircle, Edit2, Save, X, Camera, Settings, Bell, Moon, Sun, Shield, LogOut, Trash2, BookOpen, HelpCircle, Info, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = ({ user, logout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    mobile: '',
    profileImage: ''
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    defaultStudyTime: 60,
    preferredStudyTime: 'morning',
    studyDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [timetables, setTimetables] = useState([]);
  const [newTimetable, setNewTimetable] = useState({
    name: '',
    description: '',
    schedule: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
  });

  const [buttonLoading, setButtonLoading] = useState({
    saveProfile: false,
    savePreferences: false,
    changePassword: false,
    addTimetable: false,
    setActive: {},
    deleteTimetable: {}
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'study', label: 'Study Settings ', icon: BookOpen },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'feedback', label: 'Feedback', icon: Info },
    { id: 'help', label: 'Help & About', icon: HelpCircle },
  ];

  const studyTimes = [
    { value: 'morning', label: 'Morning (6AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
    { value: 'evening', label: 'Evening (6PM - 10PM)' },
    { value: 'night', label: 'Night (10PM - 2AM)' }
  ];

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'StudyApp';
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dspnqdbs1';

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        mobile: user.number || '',
        profileImage: user.profileImage || ''
      });
      console.log(user.number)
      setPreferences(user.preferences || preferences);
    }
    fetchTimetables();

    // Initialize dark mode from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    setDarkMode(isDark);
    updateTheme(isDark);
  }, [user]);

  const updateTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    updateTheme(newDarkMode);
    setPreferences(prev => ({ ...prev, theme: newDarkMode ? 'dark' : 'light' }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, or GIF)');
      return;
    }
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'StudyApp');

    try {
      toast.loading('Uploading image...', { id: 'image-upload' });

      // Upload to Cloudinary
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await res.json();
      const imageUrl = data.secure_url;

      // Update backend with new image URL
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/user/profile`,
        { profileImage: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setProfileData((prev) => ({ ...prev, profileImage: imageUrl }));
      toast.success('Profile image updated successfully!', { id: 'image-upload' });
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image. Please try again.', { id: 'image-upload' });
    }
  };

  const fetchTimetables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/study/timetables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimetables(response.data);
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
      toast.error('Failed to fetch timetables');
    }
  };

  const handleSaveProfile = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nineYearsAgo = new Date(new Date().getFullYear() - 9, new Date().getMonth(), new Date().getDate());
    const nineYearsAgoStr = nineYearsAgo.toISOString().split('T')[0];
    try {
      setButtonLoading(prev => ({ ...prev, saveProfile: true }));
      const token = localStorage.getItem('token');
      //Validation
      if (
        profileData.dateOfBirth === todayStr ||
        profileData.dateOfBirth > nineYearsAgoStr
      ) {
        toast.error('You must be at least 9 years old to use this app');
        return;
      }
      await axios.put(`${API_URL}/api/user/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setButtonLoading(prev => ({ ...prev, saveProfile: false }));
    }
  };

  const handleSavePreferences = async () => {
    try {
      setButtonLoading(prev => ({ ...prev, savePreferences: true }));
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setButtonLoading(prev => ({ ...prev, savePreferences: false }));
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setButtonLoading(prev => ({ ...prev, changePassword: true }));
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/user/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setButtonLoading(prev => ({ ...prev, changePassword: false }));
    }
  };

  const handleAddTimetable = async () => {
    if (!newTimetable.name.trim()) {
      toast.error('Please enter a timetable name');
      return;
    }

    try {
      setButtonLoading(prev => ({ ...prev, addTimetable: true }));
      const token = localStorage.getItem('token');
      if (editingTimetableId) {
        await axios.put(`${API_URL}/api/study/timetables/${editingTimetableId}`, newTimetable, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditingTimetableId(null);
      } else {
        await axios.post(`${API_URL}/api/study/timetables`, newTimetable, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchTimetables();
      setNewTimetable({
        name: '',
        description: '',
        schedule: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
      });
      toast.success('Timetable saved successfully!');
    } catch (error) {
      toast.error('Failed to save timetable');
    } finally {
      setButtonLoading(prev => ({ ...prev, addTimetable: false }));
    }
  };

  const handleSetActive = async (timetableId) => {
    try {
      setButtonLoading(prev => ({ ...prev, setActive: { ...prev.setActive, [timetableId]: true } }));
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/study/timetables/${timetableId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedTimetables = timetables.map((t) => ({
        ...t,
        isActive: t._id === timetableId,
      }));
      setTimetables(updatedTimetables);
      toast.success('Timetable set as active!');
    } catch (error) {
      console.error('Failed to set timetable active:', error);
      toast.error('Failed to set timetable active');
    } finally {
      setButtonLoading(prev => ({ ...prev, setActive: { ...prev.setActive, [timetableId]: false } }));
    }
  };

  const handleDeleteTimetable = async (timetableId) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;
    try {
      setButtonLoading(prev => ({ ...prev, deleteTimetable: { ...prev.deleteTimetable, [timetableId]: true } }));
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/study/timetables/${timetableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimetables(timetables.filter((t) => t._id !== timetableId));
      toast.success('Timetable deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete timetable');
    } finally {
      setButtonLoading(prev => ({ ...prev, deleteTimetable: { ...prev.deleteTimetable, [timetableId]: false } }));
    }
  };

  const handleEditTimetable = (timetableId) => {
    const timetableToEdit = timetables.find((t) => t._id === timetableId);
    if (!timetableToEdit) return;

    setNewTimetable({
      name: timetableToEdit.name,
      description: timetableToEdit.description || '',
      schedule: timetableToEdit.schedule || {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
      },
    });
    setEditingTimetableId(timetableId);
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const addDaySlot = (day) => {
    const daySlots = newTimetable.schedule[day] || [];
    setNewTimetable({
      ...newTimetable,
      schedule: {
        ...newTimetable.schedule,
        [day]: [...daySlots, { time: '09:00', subject: '', duration: 60 }],
      },
    });
  };

  const updateDaySlot = (day, index, field, value) => {
    const updatedDaySlots = [...(newTimetable.schedule[day] || [])];
    updatedDaySlots[index] = { ...updatedDaySlots[index], [field]: value };
    setNewTimetable({
      ...newTimetable,
      schedule: {
        ...newTimetable.schedule,
        [day]: updatedDaySlots,
      },
    });
  };

  const removeDaySlot = (day, index) => {
    const updatedDaySlots = [...(newTimetable.schedule[day] || [])];
    updatedDaySlots.splice(index, 1);
    setNewTimetable({
      ...newTimetable,
      schedule: {
        ...newTimetable.schedule,
        [day]: updatedDaySlots,
      },
    });
  };

  const handleStudyDayToggle = (day) => {
    const updatedDays = preferences.studyDays.includes(day)
      ? preferences.studyDays.filter((d) => d !== day)
      : [...preferences.studyDays, day];
    setPreferences({ ...preferences, studyDays: updatedDays });
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt="Profile"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-white font-bold text-2xl">
                {profileData.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white cursor-pointer">
            <Camera size={16} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {profileData.name || 'User'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">{profileData.email}</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Personal Information</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
            disabled={buttonLoading.saveProfile}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLoading.saveProfile ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : isEditing ? (
              <Save size={16} />
            ) : (
              <Edit2 size={16} />
            )}
            <span>{isEditing ? 'Save' : 'Edit'}</span>
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              disabled={!isEditing}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-white opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
              disabled={!isEditing}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mobile Number</label>
            <input
              type="tel"
              value={profileData.mobile}
              onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
              disabled={!isEditing}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex space-x-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              disabled={buttonLoading.saveProfile}
              className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonLoading.saveProfile ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
              ) : (
                'Save Changes'
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
            >
              Cancel
            </motion.button>
          </div>
        )}
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={logout}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm sm:text-base bg-red-500 text-white rounded-lg"
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </motion.button>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">App Preferences</h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Toggle between light and dark theme</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-all ${darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-all ${darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </motion.button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell size={20} />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Receive study reminders and updates</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
              className={`w-12 h-6 rounded-full transition-all ${preferences.notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-all ${preferences.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSavePreferences}
            disabled={buttonLoading.savePreferences}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLoading.savePreferences ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
            ) : (
              'Save Settings'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  const renderStudyTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Study Preferences</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Study Time (minutes)
            </label>
            <input
              type="number"
              value={preferences.defaultStudyTime}
              onChange={(e) => setPreferences({ ...preferences, defaultStudyTime: parseInt(e.target.value) })}
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
              value={preferences.preferredStudyTime}
              onChange={(e) => setPreferences({ ...preferences, preferredStudyTime: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Study Days</label>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <motion.button
                  key={day.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStudyDayToggle(day.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${preferences.studyDays.includes(day.value)
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                >
                  {day.label}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSavePreferences}
            disabled={buttonLoading.savePreferences}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLoading.savePreferences ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
            ) : (
              'Save Study Settings'
            )}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-4">
          Weekly Timetables ({timetables.length}/3)
        </h3>

        {timetables.length < 3 && (
          <div className="mb-6 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <h4 className="font-medium text-gray-800 dark:text-white mb-4">
              {editingTimetableId ? 'Edit Timetable' : 'Add New Timetable'}
            </h4>

            <div className="space-y-4 md:space-y-6">
              <input
                type="text"
                placeholder="Timetable name..."
                value={newTimetable.name}
                onChange={(e) => setNewTimetable({ ...newTimetable, name: e.target.value })}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm md:text-base"
              />

              <textarea
                placeholder="Description (optional)..."
                value={newTimetable.description}
                onChange={(e) => setNewTimetable({ ...newTimetable, description: e.target.value })}
                rows={2}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none text-sm md:text-base"
              />

              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="space-y-3">
                    <h5 className="text-sm md:text-md font-semibold text-gray-700 dark:text-gray-300 capitalize border-b border-gray-200 dark:border-gray-600 pb-1">
                      {day}
                    </h5>

                    {(newTimetable.schedule[day] || []).map((slot, index) => (
                      <div key={index} className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <div className="flex space-x-2 sm:space-x-3">
                            <input
                              type="time"
                              value={slot.time}
                              onChange={(e) => updateDaySlot(day, index, 'time', e.target.value)}
                              className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Min"
                              value={slot.duration}
                              onChange={(e) => updateDaySlot(day, index, 'duration', parseInt(e.target.value))}
                              className="w-16 sm:w-20 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                              min="15"
                              max="300"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Subject"
                              value={slot.subject}
                              onChange={(e) => updateDaySlot(day, index, 'subject', e.target.value)}
                              className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                            />
                            {(newTimetable.schedule[day] || []).length > 1 && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeDaySlot(day, index)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <X size={16} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addDaySlot(day)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:border-primary-500 hover:text-primary-600 transition-colors text-sm"
                    >
                      + Add {day.charAt(0).toUpperCase() + day.slice(1)} Slot
                    </motion.button>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddTimetable}
                disabled={buttonLoading.addTimetable}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buttonLoading.addTimetable ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
                ) : editingTimetableId ? (
                  'Update Timetable'
                ) : (
                  'Add Timetable'
                )}
              </motion.button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {timetables.map((timetable, index) => (
            <motion.div
              key={timetable._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm md:text-base">
                      {timetable.name}
                    </h4>
                    {timetable.isActive && (
                      <div className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs font-medium rounded-full">
                        Active
                      </div>
                    )}
                  </div>
                  {timetable.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{timetable.description}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Weekly schedule</p>
                </div>

                <div className="flex items-center space-x-2">
                  {!timetable.isActive && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetActive(timetable._id)}
                      disabled={buttonLoading.setActive[timetable._id]}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                    >
                      {buttonLoading.setActive[timetable._id] ? (
                        <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                      ) : (
                        'Set Active'
                      )}
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditTimetable(timetable._id)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteTimetable(timetable._id)}
                    disabled={buttonLoading.deleteTimetable[timetable._id]}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {buttonLoading.deleteTimetable[timetable._id] ? (
                      <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 sm:hidden">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(timetable.schedule || {}).slice(0, 4).map(([day, slots]) => (
                    <div key={day} className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium capitalize">{day.slice(0, 3)}:</span> {slots.length} slots
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Change Password</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleChangePassword}
            disabled={buttonLoading.changePassword}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLoading.changePassword ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
            ) : (
              'Change Password'
            )}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800"
      >
        <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600">Deactivate Account</p>
              <p className="text-sm text-red-500">This will temporarily disable your account</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium"
            >
              Deactivate
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Help & Support</h3>

        <div className="space-y-4">
          <Link
            to="/help"
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="text-primary-600" size={20} />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Help Center</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">FAQs and user guides</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            to="/about"
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Info className="text-primary-600" size={20} />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">About Focus Vault</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Learn more about our mission</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-6 border border-primary-200 dark:border-primary-800"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">App Information</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Version</span>
            <span className="font-medium text-gray-800 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Last Updated</span>
            <span className="font-medium text-gray-800 dark:text-white">January 2025</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Platform</span>
            <span className="font-medium text-gray-800 dark:text-white">Progressive Web App</span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderFeedbackTab = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Feedback & Suggestions</h3>

        <div className="space-y-4">
          <Link
            to="/feedback"
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MessageCircle className="text-primary-600" size={20} />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Submit Feedback</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share your thoughts and ideas</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            to="/report-issue"
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="text-primary-600" size={20} />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Report an Issue</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Let us know about any problems</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-6 border border-primary-200 dark:border-primary-800"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Community Engagement</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Feedback Portal</span>
            <span className="font-medium text-gray-800 dark:text-white">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Response Time</span>
            <span className="font-medium text-gray-800 dark:text-white">Within 72 hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">User Suggestions</span>
            <span className="font-medium text-gray-800 dark:text-white">Always Welcome</span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account and preferences</p>
        </div>
      </motion.div>

      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex space-x-2 pb-2 min-w-max border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center space-x-2 px-4 py-2 font-medium focus:ring-0 outline:none focus:outline-none whitespace-nowrap transition-all duration-200
          text-sm border-b-2
          ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400'}
        `}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="min-h-[60vh]">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'study' && renderStudyTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'feedback' && renderFeedbackTab()}
        {activeTab === 'help' && renderHelpTab()}
      </div>
    </div>
  );
};

export default Profile;