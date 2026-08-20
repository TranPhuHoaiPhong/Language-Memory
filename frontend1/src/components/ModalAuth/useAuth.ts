import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import {
    login,
    registerWithOTP,
    verifyOTP,
} from "../../services/authService";

export type AuthMode = "login" | "register";
export type AuthStep = "form" | "otp";

export function useAuth(
    onLoginSuccess: (token: string) => void,
    onClose: () => void
) {
    const [mode, setMode] = useState<AuthMode>("login");
    const [step, setStep] = useState<AuthStep>("form");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [tempEmail, setTempEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canRetry, setCanRetry] = useState(false);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ================= PASSWORD =================

    const validatePassword = (pwd: string) => {
        return {
            isValid: pwd.length >= 6,
            hasMinLength: pwd.length >= 6,
        };
    };

    // ================= RESET =================

    const reset = () => {
        setMode("login");
        setStep("form");
        setEmail("");
        setPassword("");
        setOtp("");
        setTempEmail("");
        setCountdown(60);
        setCanRetry(false);
        setLoading(false);
    };

    // ================= CLOSE =================

    const handleClose = () => {
        if (loading) return;

        reset();
        onClose();
    };

    // ================= OTP COUNTDOWN =================

    useEffect(() => {
        if (step !== "otp") return;

        setCountdown(60);
        setCanRetry(false);

        const focusTimer = setTimeout(() => {
            otpRefs.current[0]?.focus();
        }, 100);

        return () => clearTimeout(focusTimer);
    }, [step]);

    useEffect(() => {
        if (step !== "otp" || countdown <= 0) {
            if (countdown === 0) {
                setCanRetry(true);
            }

            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [step, countdown]);

    // ================= LOGIN =================

    const handleLogin = async (
        loginEmail: string,
        loginPassword: string
    ) => {
        setLoading(true);

        try {
            const data = await login(loginEmail, loginPassword);

            localStorage.setItem("token", data.token);

            message.success("Login successful!");

            onLoginSuccess(data.token);

            handleClose();
        } catch (err: any) {
            message.error(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    // ================= REGISTER =================

    const handleRegister = async (
        registerEmail: string,
        registerPassword: string
    ) => {
        setLoading(true);

        try {
            await registerWithOTP(
                registerEmail,
                registerPassword
            );

            setEmail(registerEmail);
            setPassword(registerPassword);
            setTempEmail(registerEmail);

            setOtp("");
            setStep("otp");

            message.success(
                "Verification code sent to your email"
            );
        } catch (err: any) {
            message.error(
                err.message || "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    // ================= OTP INPUT =================

    const handleOtpChange = (
        index: number,
        value: string
    ) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = otp.padEnd(6, "").split("");

        newOtp[index] = value.slice(-1);

        const updatedOtp = newOtp.join("");

        setOtp(updatedOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => {
        e.preventDefault();

        const pasteData = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasteData) return;

        setOtp(pasteData);

        const focusIndex = Math.min(
            pasteData.length,
            5
        );

        otpRefs.current[focusIndex]?.focus();
    };

    // ================= VERIFY OTP =================

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            message.warning(
                "Please enter the complete 6-digit verification code"
            );

            return;
        }

        setLoading(true);

        try {
            const data = await verifyOTP(
                tempEmail,
                otp
            );

            localStorage.setItem("token", data.token);

            message.success(
                "OTP verified successfully!"
            );

            onLoginSuccess(data.token);

            handleClose();
        } catch (err: any) {
            message.error(
                err.message || "Invalid OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    // ================= RESEND OTP =================

    const handleRetry = async () => {
        if (!canRetry) return;

        setLoading(true);

        try {
            await registerWithOTP(
                tempEmail,
                password
            );

            setOtp("");
            setCountdown(60);
            setCanRetry(false);

            message.success(
                "New verification code sent"
            );
        } catch (err: any) {
            message.error(
                err.message ||
                "Failed to resend verification code"
            );
        } finally {
            setLoading(false);
        }
    };

    return {
        mode,
        setMode,

        step,

        email,
        password,

        otp,
        tempEmail,

        loading,

        countdown,
        canRetry,

        otpRefs,

        validatePassword,

        handleLogin,
        handleRegister,

        handleOtpChange,
        handleOtpKeyDown,
        handleOtpPaste,

        handleVerifyOTP,
        handleRetry,

        handleClose,
        reset,
    };
}