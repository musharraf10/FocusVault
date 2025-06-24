// src/services/apiService.js
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "StudyApp";
const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dspnqdbs1";

export const setupAxios = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

// Profile-related API calls
export const fetchUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/user/profile`);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch profile");
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    await axios.put(`${API_URL}/api/user/profile`, profileData);
    toast.success("Profile updated successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update profile");
    throw error;
  }
};

export const updateProfileImage = async (file) => {
  const validTypes = ["image/jpeg", "image/png", "image/gif"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    toast.error("No file selected");
    throw new Error("No file selected");
  }
  if (!validTypes.includes(file.type)) {
    toast.error("Please upload a valid image (JPEG, PNG, or GIF)");
    throw new Error("Invalid file type");
  }
  if (file.size > maxSize) {
    toast.error("Image size must be less than 5MB");
    throw new Error("File too large");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "StudyApp");

  try {
    toast.loading("Uploading image...", { id: "image-upload" });
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    const imageUrl = data.secure_url;

    await axios.put(`${API_URL}/api/user/profile`, { profileImage: imageUrl });
    toast.success("Profile image updated successfully!", {
      id: "image-upload",
    });
    return imageUrl;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to upload image", {
      id: "image-upload",
    });
    throw error;
  }
};

export const updatePreferences = async (preferences) => {
  try {
    await axios.put(`${API_URL}/api/user/preferences`, preferences);
    toast.success("Settings updated successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update settings");
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    toast.error("New passwords do not match");
    throw new Error("Passwords do not match");
  }
  if (passwordData.newPassword.length < 6) {
    toast.error("Password must be at least 6 characters");
    throw new Error("Password too short");
  }

  try {
    await axios.put(`${API_URL}/api/user/password`, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    toast.success("Password changed successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to change password");
    throw error;
  }
};

// Timetable-related API calls
export const fetchTimetables = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/study/timetables`);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch timetables");
    throw error;
  }
};

export const addTimetable = async (timetable) => {
  if (!timetable.name.trim()) {
    toast.error("Please enter a timetable name");
    throw new Error("Timetable name required");
  }

  try {
    await axios.post(`${API_URL}/api/study/timetables`, timetable);
    toast.success("Timetable added successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to add timetable");
    throw error;
  }
};

export const updateTimetable = async (timetableId, timetable) => {
  if (!timetable.name.trim()) {
    toast.error("Please enter a timetable name");
    throw new Error("Timetable name required");
  }

  try {
    await axios.put(
      `${API_URL}/api/study/timetables/${timetableId}`,
      timetable
    );
    toast.success("Timetable updated successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update timetable");
    throw error;
  }
};

export const setActiveTimetable = async (timetableId) => {
  try {
    await axios.put(
      `${API_URL}/api/study/timetables/${timetableId}/activate`,
      {}
    );
    toast.success("Timetable set as active!");
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to set timetable active"
    );
    throw error;
  }
};

export const deleteTimetable = async (timetableId) => {
  if (!window.confirm("Are you sure you want to delete this timetable?")) {
    throw new Error("Deletion cancelled");
  }

  try {
    await axios.delete(`${API_URL}/api/study/timetables/${timetableId}`);
    toast.success("Timetable deleted successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to delete timetable");
    throw error;
  }
};

// Study-related API calls
export const fetchDashboard = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/study/dashboard`);
    return response.data;
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to fetch dashboard data"
    );
    throw error;
  }
};

export const fetchActiveSessions = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/study/state`);
    return response.data || [];
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to fetch active sessions"
    );
    throw error;
  }
};

export const fetchCompletedSubjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/study/sessions/today`);
    return response.data || [];
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to fetch completed subjects"
    );
    throw error;
  }
};

export const fetchSessionStats = async (period = "week", subject = null) => {
  try {
    const params = new URLSearchParams({ period });
    if (subject) params.append("subject", subject);
    const response = await axios.get(
      `${API_URL}/api/study/sessions/stats?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to fetch session stats"
    );
    throw error;
  }
};

export const startStudySession = async (subject, targetTime = 3600) => {
  try {
    const response = await axios.post(`${API_URL}/api/study/state/start`, {
      subject,
      targetTime,
    });
    toast.success(`Started study session for ${subject}`);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to start session");
    throw error;
  }
};

export const pauseSession = async (sessionId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/study/state/${sessionId}`,
      { status: "paused" }
    );
    toast.success("Session paused");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to pause session");
    throw error;
  }
};

export const resumeSession = async (sessionId) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/study/state/${sessionId}`,
      { status: "active" }
    );
    toast.success("Session resumed");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to resume session");
    throw error;
  }
};

export const updateSessionTime = async (sessionId, elapsedTime) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/study/state/${sessionId}`,
      { elapsedTime }
    );
    return response.data;
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to update session time"
    );
    throw error;
  }
};

export const endSession = async (sessionId, notes = "") => {
  try {
    await axios.post(`${API_URL}/api/study/state/${sessionId}/end`, { notes });
    toast.success("Session ended");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to end session");
    throw error;
  }
};

export const cancelSession = async (sessionId) => {
  try {
    await axios.delete(`${API_URL}/api/study/state/${sessionId}`);
    toast.success("Session cancelled");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to cancel session");
    throw error;
  }
};

export const fetchNotes = async (
  search = "",
  subject = "",
  page = 1,
  limit = 10
) => {
  try {
    const params = new URLSearchParams({ search, subject, page, limit });
    const response = await axios.get(
      `${API_URL}/api/study/notes?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch notes");
    throw error;
  }
};

export const addNote = async (noteData) => {
  if (!noteData.title?.trim() || !noteData.body?.trim()) {
    toast.error("Note title and content cannot be empty");
    throw new Error("Note title and content required");
  }

  try {
    const response = await axios.post(`${API_URL}/api/study/notes`, noteData);
    toast.success("Note added successfully!");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to add note");
    throw error;
  }
};

export const updateNote = async (noteId, noteData) => {
  if (!noteData.title?.trim() || !noteData.body?.trim()) {
    toast.error("Note title and content cannot be empty");
    throw new Error("Note title and content required");
  }

  try {
    const response = await axios.put(
      `${API_URL}/api/study/notes/${noteId}`,
      noteData
    );
    toast.success("Note updated successfully!");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update note");
    throw error;
  }
};

export const deleteNote = async (noteId) => {
  if (!window.confirm("Are you sure you want to delete this note?")) {
    throw new Error("Deletion cancelled");
  }

  try {
    await axios.delete(`${API_URL}/api/study/notes/${noteId}`);
    toast.success("Note deleted successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to delete note");
    throw error;
  }
};

export const togglePinNote = async (noteId, isPinned) => {
  try {
    const response = await axios.put(`${API_URL}/api/study/notes/${noteId}`, {
      isPinned,
    });
    toast.success(`Note ${isPinned ? "pinned" : "unpinned"} successfully!`);
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to toggle pin");
    throw error;
  }
};
