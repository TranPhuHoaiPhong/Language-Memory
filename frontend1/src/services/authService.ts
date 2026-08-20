// src/services/authService.ts

const API_URL = "http://localhost:5000/api";

// Đăng ký gửi OTP (giả lập)
export const registerWithOTP = async (email: string, password: string) => {
    // Giả lập gửi OTP (mã 123456)
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ email, userId: "mock-user-id" });
        }, 500);
    });
};

// Xác thực OTP
export const verifyOTP = async (email: string, otp: string) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (otp === "123456") {
                resolve({ token: "mock-jwt-token", user: { email } });
            } else {
                reject(new Error("Mã OTP không hợp lệ"));
            }
        }, 500);
    });
};

// Đăng nhập (giữ nguyên)
export const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
    }
    return data; // { token, user }
};

export const logout = () => {
    localStorage.removeItem("token");
};