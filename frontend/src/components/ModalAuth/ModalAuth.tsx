import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import { login, registerWithOTP, verifyOTP } from "../../services/authService";
import "./ModalAuth.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (token: string) => void;
}

export default function ModalAuth({ isOpen, onClose, onLoginSuccess }: Props) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState<string>(""); // lưu chuỗi 6 số
    const [step, setStep] = useState<"form" | "otp">("form");
    const [tempEmail, setTempEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canRetry, setCanRetry] = useState(false);

    // Refs cho 6 ô OTP
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Validate password strength
    const validatePassword = (pwd: string) => {
        const hasMinLength = pwd.length >= 6;
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
        return {
            isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial,
            hasMinLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecial,
        };
    };

    const passwordValidation = validatePassword(password);
    const isPasswordValid = passwordValidation.isValid;

    // Reset form when modal closes
    const resetForm = () => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setStep("form");
        setTempEmail("");
        setCountdown(60);
        setCanRetry(false);
        setLoading(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
        // Reset refs focus không cần thiết
    };

    // Reset countdown when step changes to OTP
    useEffect(() => {
        if (step === "otp") {
            setCountdown(60);
            setCanRetry(false);
            // Tự động focus vào ô OTP đầu tiên
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    // Timer countdown
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (step === "otp" && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setCanRetry(true);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [step, countdown]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Hàm xử lý thay đổi từng ô OTP
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // chỉ cho phép số
        const newOtp = otp.split('');
        newOtp[index] = value.slice(0, 1); // chỉ lấy ký tự đầu
        const updatedOtp = newOtp.join('');
        setOtp(updatedOtp);

        // Tự động chuyển sang ô tiếp theo
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    // Xử lý phím Backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // Xử lý paste vào ô đầu tiên
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d{6}$/.test(pasteData)) {
            setOtp(pasteData);
            // Focus vào ô cuối
            otpRefs.current[5]?.focus();
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(email, password);
            localStorage.setItem("token", data.token);
            message.success("Login successful!");
            onLoginSuccess(data.token);
            onClose();
        } catch (err: any) {
            message.error(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            message.error("Passwords do not match");
            return;
        }
        if (!isPasswordValid) {
            message.error("Password must be at least 6 characters, include uppercase, lowercase, number and special character");
            return;
        }
        setLoading(true);
        try {
            await registerWithOTP(email, password);
            setTempEmail(email);
            setStep("otp");
            message.success("Verification code sent to your email");
        } catch (err: any) {
            message.error(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length < 6) return;
        setLoading(true);
        try {
            const data = await verifyOTP(tempEmail, otp);
            localStorage.setItem("token", data.token);
            message.success("OTP verified successfully!");
            onLoginSuccess(data.token);
            onClose();
        } catch (err: any) {
            message.error(err.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async () => {
        if (!canRetry) return;
        setLoading(true);
        try {
            await registerWithOTP(tempEmail, password);
            setCountdown(60);
            setCanRetry(false);
            message.success("New verification code sent");
        } catch (err: any) {
            message.error(err.message || "Failed to resend code");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-auth" onClick={(e) => e.stopPropagation()}>
                {step === "otp" ? (
                    <div className="otp-section">
                        <h2>Verify OTP</h2>
                        <p>We sent a verification code to <strong>{tempEmail}</strong></p>

                        {/* 6 ô nhập OTP */}
                        <div className="otp-input-group">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => (otpRefs.current[idx] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otp[idx] || ''}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    onPaste={idx === 0 ? handlePaste : undefined}
                                    className="otp-input-box"
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>

                        <div className="otp-actions">
                            {canRetry ? (
                                <button onClick={handleRetry} disabled={loading} className="retry-btn">
                                    {loading ? "Sending..." : "Retry"}
                                </button>
                            ) : (
                                <>
                                    <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6}>
                                        {loading ? "Verifying..." : "Verify"}
                                    </button>
                                    <div className="countdown-text">
                                        Resend in <span>{countdown}</span>s
                                    </div>
                                </>
                            )}
                        </div>
                        <button className="back-btn" onClick={() => setStep("form")}>
                            Back
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="modal-tabs">
                            <button
                                className={mode === "login" ? "active" : ""}
                                onClick={() => setMode("login")}
                            >
                                Login
                            </button>
                            <button
                                className={mode === "register" ? "active" : ""}
                                onClick={() => setMode("register")}
                            >
                                Sign Up
                            </button>
                        </div>

                        {mode === "login" ? (
                            <form onSubmit={handleLogin} className="auth-form">
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="input-group password-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                                <button type="submit" disabled={loading}>
                                    {loading ? "Logging in..." : "Login"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="auth-form">
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="input-group password-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password (min 6 chars)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className={
                                            password && !isPasswordValid ? "invalid" :
                                                password && isPasswordValid ? "valid" : ""
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                    {password && !isPasswordValid && (
                                        <div className="password-requirements">
                                            <div className={passwordValidation.hasMinLength ? "met" : "unmet"}>
                                                {passwordValidation.hasMinLength ? "✓" : "○"} At least 6 characters
                                            </div>
                                            <div className={passwordValidation.hasUpperCase ? "met" : "unmet"}>
                                                {passwordValidation.hasUpperCase ? "✓" : "○"} Uppercase letter
                                            </div>
                                            <div className={passwordValidation.hasLowerCase ? "met" : "unmet"}>
                                                {passwordValidation.hasLowerCase ? "✓" : "○"} Lowercase letter
                                            </div>
                                            <div className={passwordValidation.hasNumber ? "met" : "unmet"}>
                                                {passwordValidation.hasNumber ? "✓" : "○"} Number
                                            </div>
                                            <div className={passwordValidation.hasSpecial ? "met" : "unmet"}>
                                                {passwordValidation.hasSpecial ? "✓" : "○"} Special character
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="input-group password-group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className={
                                            confirmPassword && password !== confirmPassword ? "invalid" :
                                                confirmPassword && password === confirmPassword ? "valid" : ""
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                                <button type="submit" disabled={loading || !isPasswordValid}>
                                    {loading ? "Signing up..." : "Sign Up"}
                                </button>
                            </form>
                        )}

                        <p className="switch-mode">
                            {mode === "login" ? (
                                <>Don't have an account? <button onClick={() => setMode("register")}>Sign Up</button></>
                            ) : (
                                <>Already have an account? <button onClick={() => setMode("login")}>Login</button></>
                            )}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}