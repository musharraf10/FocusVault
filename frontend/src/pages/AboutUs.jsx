import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, Users, Zap, Github, Mail, Heart, Shield, Database,
  Smartphone, ArrowLeft, User, Code, Trophy, ChevronDown, ChevronUp,
  ExternalLink, Calendar, MapPin, GraduationCap, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const AboutUs = () => {
  const navigate = useNavigate();
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);

  const features = [
    {
      icon: Target,
      title: 'Smart Study Timer',
      description: 'Track your study sessions with intelligent timing and progress analytics.'
    },
    {
      icon: BookOpen,
      title: 'Note Management',
      description: 'Organize your study notes with tags, search, and pinning capabilities.'
    },
    {
      icon: Users,
      title: 'Study Groups',
      description: 'Connect with study partners in real-time chat rooms for motivation.'
    },
    {
      icon: Zap,
      title: 'PWA Ready',
      description: 'Install on any device and study offline with our Progressive Web App.'
    }
  ];

  const techStack = [
    { name: 'React', description: 'Modern UI framework' },
    { name: 'Node.js', description: 'Backend runtime' },
    { name: 'MongoDB', description: 'Database storage' },
    { name: 'Redis', description: 'Caching & sessions' },
    { name: 'PWA', description: 'Mobile-first design' },
    { name: 'Socket.io', description: 'Real-time features' }
  ];

  const developerSkills = [
    { category: 'Languages', skills: ['Python', 'Java (JCF, DSA)', 'JavaScript (DOM, Functions, Event Listeners)'] },
    { category: 'Frontend', skills: ['ReactJS (Hooks, Props, State)', 'Tailwind CSS', 'EJS'] },
    { category: 'Backend', skills: ['Node.js', 'Express', 'REST APIs', 'JWT Auth', 'WebRTC', 'Socket.IO'] },
    { category: 'Databases', skills: ['MongoDB', 'MySQL'] },
    { category: 'Dev Tools', skills: ['Git & GitHub', 'Postman', 'Stripe', 'Cloudinary', 'MapBox'] }
  ];

  const projects = [
    {
      title: 'FocusVault – Study Productivity Web App',
      period: 'In Progress',
      description: 'A full-featured PWA designed to help students manage study routines and track progress.',
      features: ['Timetable-based study tracking', 'Study Timer with persistent state', 'Notes & Reading Mode', 'Dashboard with analytics', 'JWT authentication'],
      tech: 'React, TailwindCSS, Framer Motion, Redux, MongoDB, Express'
    },
    {
      title: 'Blogging Platform – MERN Stack',
      period: 'Feb 2025',
      description: 'A powerful content management system with role-based access.',
      features: ['Role-based access (Admin, Curator, Subscriber)', 'JWT-secured authentication', 'Rich text editor', 'Responsive UI'],
      tech: 'MERN Stack, Tailwind CSS'
    },
    {
      title: 'Video Call App – WebRTC',
      period: 'Dec 2024',
      description: 'Real-time communication platform with video/audio streaming.',
      features: ['Peer-to-peer video/audio via WebRTC', 'Socket.IO for real-time signaling', 'Screen sharing', 'Group chat'],
      tech: 'React, Node.js, WebRTC, Socket.IO'
    },
    {
      title: 'Wanderlust – Hostel Booking App',
      period: 'Nov 2023',
      description: 'Travel-based app to book and explore hostels.',
      features: ['JWT-secured authentication', 'Cloudinary for image storage', 'MapBox for geolocation', 'REST APIs'],
      tech: 'MERN Stack, Cloudinary, MapBox',
      link: 'https://wanderlust-project-link.com'
    }
  ];

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with Back Button */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12 relative"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Focus Vault
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your personal study companion designed to help you stay organized, motivated, and productive in your learning journey.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
            <Heart className="text-red-500" size={24} />
            <span>Our Mission</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
            I believe that effective studying shouldn't be complicated. Focus Vault combines modern technology
            with proven study techniques to create a seamless experience that adapts to your learning style.
            Whether you're a student, professional, or lifelong learner, our platform helps you build consistent
            study habits and achieve your educational goals.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * (index + 3) }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center space-x-2">
            <Database className="text-blue-500" size={24} />
            <span>Built With Modern Technology</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * index }}
                className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                  {tech.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
            <Shield className="text-green-500" size={24} />
            <span>Privacy & Security</span>
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              <strong>Your data is secure:</strong> We use industry-standard encryption and security practices
              to protect your personal information and study data.
            </p>
            <p>
              <strong>Privacy-first approach:</strong> We only collect data necessary for app functionality
              and never share your personal information with third parties.
            </p>
            <p>
              <strong>Local storage:</strong> Many features work offline, keeping your data on your device
              when possible for maximum privacy and performance.
            </p>
          </div>
        </motion.div>

        {/* Developer Information Toggle */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8 overflow-hidden"
        >
          <motion.button
            onClick={() => setShowDeveloperInfo(!showDeveloperInfo)}
            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
            className="w-full p-6 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  About the Developer
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Learn more about who built Focus Vault
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showDeveloperInfo ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="text-gray-400" size={20} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showDeveloperInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-100 dark:border-gray-700"
              >
                <div className="p-6 space-y-8">
                  {/* Developer Bio */}
                  <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      SM
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                        Shaik Musharaf
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <GraduationCap size={16} />
                          <span>B.Tech IT (2020–2024)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin size={16} />
                          <span>NRI Institute of Technology</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Code size={16} />
                          <span>Full-Stack Developer</span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Passionate full-stack web developer specializing in the MERN Stack with a strong foundation
                        in Java, Python, and JavaScript. Committed to creating seamless digital experiences with
                        clean architecture, security, responsiveness, and user engagement at the forefront.
                      </p>
                    </div>
                  </div>

                  {/* Current Project Highlight */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center space-x-2">
                      <Briefcase className="text-blue-500" size={20} />
                      <span>Current Focus</span>
                    </h4>
                    <div className="space-y-2">
                      <h5 className="font-semibold text-gray-800 dark:text-white">
                        📚 FocusVault – Study Productivity Web App
                      </h5>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        A comprehensive PWA helping students manage study routines with features like
                        timetable-based tracking, persistent timers, notes management, and analytics dashboard.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['React', 'TailwindCSS', 'Framer Motion', 'Redux', 'MongoDB', 'Express'].map((tech) => (
                          <span key={tech} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Previous Projects */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                      <Trophy className="text-yellow-500" size={20} />
                      <span>Previous Projects</span>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {projects.slice(1).map((project, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-gray-800 dark:text-white text-sm">
                              {project.title}
                            </h5>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                              {project.period}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-xs mb-2">
                            {project.description}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <strong>Tech:</strong> {project.tech}
                          </div>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-xs mt-2"
                            >
                              <ExternalLink size={12} />
                              <span>View Live</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Skills */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                      <Code className="text-green-500" size={20} />
                      <span>Technical Expertise</span>
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {developerSkills.map((skillGroup, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <h5 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm">
                            {skillGroup.category}
                          </h5>
                          <div className="space-y-1">
                            {skillGroup.skills.map((skill, skillIndex) => (
                              <span key={skillIndex} className="block text-xs text-gray-600 dark:text-gray-300">
                                • {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center space-x-2">
                      <Trophy className="text-green-500" size={20} />
                      <span>Key Achievements</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          <strong>Trainer at NRI College (2023):</strong> Trained 50+ juniors on web fundamentals including HTML, CSS, JavaScript, and SQL
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          Built and maintained full-stack applications independently with focus on modern UI design
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          Known for rapid prototyping, team collaboration, and implementing modern development practices
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
                      Connect with the Developer
                    </h4>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <motion.a
                        href="mailto:skmusharaf01@gmail.com"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <Mail size={16} className="text-red-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                      </motion.a>

                      <motion.a
                        href="https://github.com/musharraf10"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <Github size={16} className="text-gray-700 dark:text-gray-300" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">GitHub</span>
                      </motion.a>

                      <motion.a
                        href="https://skmusharaf.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors"
                      >
                        <ExternalLink size={16} />
                        <span className="text-sm">Portfolio</span>
                      </motion.a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Get in Touch */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white text-center"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Have questions, suggestions, or need support? We'd love to hear from you!
            Focus Vault is continuously evolving based on user feedback.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <motion.a
              href="mailto:skmusharaf01@gmail.com"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-colors"
            >
              <Mail size={20} />
              <span>skmusharaf01@gmail.com</span>
            </motion.a>

            <motion.a
              href="https://github.com/musharraf10/FocusVault"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-colors"
            >
              <Github size={20} />
              <span>View on GitHub</span>
            </motion.a>
          </div>
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8 text-gray-500 dark:text-gray-400"
        >
          <p className="text-sm">
            Focus Vault v1.0.1 • Built with ❤️ for learners everywhere
          </p>
          <p className="text-xs mt-2">
            © 2025 Focus Vault. Made for educational purposes.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;