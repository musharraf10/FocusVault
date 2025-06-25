import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Shield, ArrowLeft, CheckCircle, Send, Smartphone } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import toast from 'react-hot-toast';
import axios from 'axios';

const PhoneVerification = ({ onComplete, onBack }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('send');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const recaptchaRef = useRef(null);
    const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        if (step === 'send' && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { },
            });
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, [step]);

    const handlePhoneChange = (e) => {
        const input = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(input);
    };

    const sendOTP = async () => {
        const formattedNumber = `+91${phone}`;
        if (phone.length !== 10) {
            toast.error('Please enter a valid 10-digit Indian phone number');
            return;
        }

        setLoading(true);
        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
            setConfirmationResult(result);
            setStep('verify');
            setCountdown(60);
            toast.success('OTP sent to your number');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (!confirmationResult) {
            toast.error('OTP expired. Please resend.');
            return;
        }

        setLoading(true);
        try {
            const result = await confirmationResult.confirm(otp);
            const phoneNumber = result.user.phoneNumber;

            // Call backend to save
            await axios.post(`${API_URL}/api/auth/verify-phone`, { phoneNumber });

            setStep('completed');
            toast.success('Phone number verified!');
            if (onComplete) onComplete();
        } catch (error) {
            console.error(error);
            toast.error('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        if (countdown > 0) return;
        setStep('send');
        setOtp('');
        setConfirmationResult(null);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 }
        }
    };

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.02 },
        tap: { scale: 0.98 }
    };

    const pulseVariants = {
        pulse: {
            scale: [1, 1.05, 1],
            transition: { duration: 2, repeat: Infinity }
        }
    };

    if (step === 'completed') {
        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
            >
                <div className="w-full max-w-sm">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                        className="text-center"
                    >
                        <div className="relative mb-8">
                            <motion.div
                                animate={pulseVariants.pulse}
                                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-xl"
                            >
                                <CheckCircle className="text-white" size={48} />
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
                            >
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            </motion.div>
                        </div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3"
                        >
                            Verified!
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 dark:text-gray-300 mb-8 text-lg"
                        >
                            Your phone number has been successfully verified.
                        </motion.p>

                        <motion.button
                            variants={buttonVariants}
                            initial="idle"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={onComplete}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Continue
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl"></div>
                <div className="relative px-4 pt-12 pb-8">
                    {onBack && (
                        <motion.button
                            variants={buttonVariants}
                            initial="idle"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={onBack}
                            className="absolute top-12 left-4 p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg"
                        >
                            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
                        </motion.button>
                    )}

                    <div className="text-center pt-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="relative mb-6"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                                <Phone className="text-white" size={36} />
                            </div>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-sm"
                            ></motion.div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3"
                        >
                            Verify Phone
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-600 dark:text-gray-300 text-lg px-8"
                        >
                            {step === 'send'
                                ? 'Enter your Indian phone number to receive OTP'
                                : 'Enter the 6-digit OTP sent to your number'}
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-8">
                <div className="max-w-sm mx-auto">
                    {/* Security Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl backdrop-blur-sm"
                    >
                        <div className="flex items-start space-x-3">
                            <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Shield className="text-amber-600 dark:text-amber-400" size={18} />
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                                    Security Notice
                                </p>
                                <p className="text-amber-700 dark:text-amber-300">
                                    Use a real Indian mobile number. This cannot be changed later.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {step === 'send' ? (
                            <motion.div
                                key="send"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div>
                                    <motion.label
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1"
                                    >
                                        Phone Number
                                    </motion.label>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="relative"
                                    >
                                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="flex items-center px-4 py-4 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                                                <span className="text-gray-700 dark:text-gray-200 font-medium">🇮🇳 +91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={handlePhoneChange}
                                                placeholder="9876543210"
                                                className="flex-1 px-4 py-4 bg-transparent text-gray-800 dark:text-white text-lg font-medium focus:outline-none"
                                                maxLength={10}
                                            />
                                            {phone.length === 10 && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="pr-4"
                                                >
                                                    <CheckCircle className="text-emerald-500" size={20} />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>

                                <div id="recaptcha-container" />

                                <motion.button
                                    variants={buttonVariants}
                                    initial="idle"
                                    whileHover={phone.length === 10 ? "hover" : "idle"}
                                    whileTap={phone.length === 10 ? "tap" : "idle"}
                                    onClick={sendOTP}
                                    disabled={phone.length !== 10 || loading}
                                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${phone.length === 10 && !loading
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-xl'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            <span>Send OTP</span>
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="verify"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="relative">
                                    <motion.input
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="••••••"
                                        className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] text-gray-800 dark:text-white shadow-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                        maxLength={6}
                                    />

                                    {otp.length === 6 && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="absolute top-6 right-6"
                                        >
                                            <CheckCircle className="text-emerald-500" size={24} />
                                        </motion.div>
                                    )}
                                </div>

                                <motion.button
                                    variants={buttonVariants}
                                    initial="idle"
                                    whileHover={otp.length === 6 ? "hover" : "idle"}
                                    whileTap={otp.length === 6 ? "tap" : "idle"}
                                    onClick={verifyOTP}
                                    disabled={otp.length !== 6 || loading}
                                    className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${otp.length === 6 && !loading
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            <span>Verify OTP</span>
                                        </>
                                    )}
                                </motion.button>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-center"
                                >
                                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                                        Didn't receive the code?
                                    </p>
                                    {countdown > 0 ? (
                                        <motion.div
                                            key={countdown}
                                            initial={{ scale: 1.1 }}
                                            animate={{ scale: 1 }}
                                            className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400"
                                        >
                                            <Smartphone size={16} />
                                            <span>Resend in {countdown}s</span>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            variants={buttonVariants}
                                            initial="idle"
                                            whileHover="hover"
                                            whileTap="tap"
                                            onClick={resend}
                                            className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
                                        >
                                            <Send size={16} />
                                            <span>Resend Code</span>
                                        </motion.button>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PhoneVerification;