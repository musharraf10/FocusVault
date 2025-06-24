import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// import { useAppDispatch, useAuth } from '../../hooks/useRedux';
// import { verifyPhone, setPhoneVerificationStep } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const PhoneVerification = ({ onComplete, onBack }) => {
    const dispatch = useAppDispatch();
    const { phoneVerificationStep, loading } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const recaptchaRef = useRef(null);

    useEffect(() => {
        let interval;
        if (countdown > 0) {
            interval = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [countdown]);

    useEffect(() => {
        // Initialize reCAPTCHA
        if (phoneVerificationStep === 'send' && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved
                }
            });
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, [phoneVerificationStep]);

    const formatPhoneNumber = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Format as +1 (XXX) XXX-XXXX
        if (digits.length >= 10) {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
        } else if (digits.length >= 7) {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        } else if (digits.length >= 4) {
            return `+1 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
        } else if (digits.length >= 1) {
            return `+1 (${digits.slice(1)}`;
        }
        return '+1 ';
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
    };

    const sendVerificationCode = async () => {
        try {
            // Extract digits only for Firebase
            const digits = phoneNumber.replace(/\D/g, '');
            const formattedNumber = `+${digits}`;

            if (digits.length !== 11 || !digits.startsWith('1')) {
                toast.error('Please enter a valid US phone number');
                return;
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);

            setConfirmationResult(confirmation);
            dispatch(setPhoneVerificationStep('verify'));
            setCountdown(60);
            toast.success('Verification code sent!');
        } catch (error) {
            console.error('Error sending verification code:', error);
            toast.error('Failed to send verification code. Please try again.');

            // Reset reCAPTCHA
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        }
    };

    const verifyCode = async () => {
        try {
            if (!confirmationResult) {
                toast.error('Please request a new verification code');
                return;
            }

            await confirmationResult.confirm(verificationCode);

            // Update backend
            const digits = phoneNumber.replace(/\D/g, '');
            const formattedNumber = `+${digits}`;

            await dispatch(verifyPhone({
                phoneNumber: formattedNumber,
                verificationCode
            })).unwrap();

            dispatch(setPhoneVerificationStep('completed'));
            toast.success('Phone number verified successfully!');

            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            toast.error('Invalid verification code. Please try again.');
        }
    };

    const resendCode = async () => {
        if (countdown > 0) return;

        setVerificationCode('');
        setConfirmationResult(null);
        dispatch(setPhoneVerificationStep('send'));

        // Reset reCAPTCHA
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }

        setTimeout(() => {
            sendVerificationCode();
        }, 1000);
    };

    if (phoneVerificationStep === 'completed') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    Phone Verified!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your phone number has been successfully verified.
                </p>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onComplete}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium"
                >
                    Continue
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Verify Your Phone
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                    {phoneVerificationStep === 'send'
                        ? 'Enter your phone number to receive a verification code'
                        : 'Enter the 6-digit code sent to your phone'
                    }
                </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                    <Shield className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Important Notice</p>
                        <p>Your phone number and email cannot be changed after registration. Please ensure they are correct.</p>
                    </div>
                </div>
            </div>

            {phoneVerificationStep === 'send' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="+1 (555) 123-4567"
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        />
                    </div>

                    <div id="recaptcha-container"></div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={sendVerificationCode}
                        disabled={loading || phoneNumber.replace(/\D/g, '').length !== 11}
                        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </motion.button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-center text-2xl tracking-widest"
                            maxLength={6}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={verifyCode}
                        disabled={loading || verificationCode.length !== 6}
                        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </motion.button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Didn't receive the code?{' '}
                            {countdown > 0 ? (
                                <span className="text-gray-500">Resend in {countdown}s</span>
                            ) : (
                                <button
                                    onClick={resendCode}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Resend Code
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Back Button */}
            {onBack && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onBack}
                    className="w-full flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </motion.button>
            )}
        </div>
    );
};

export default PhoneVerification;