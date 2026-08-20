import {
    Modal,
    Tabs,
    Typography,
} from "antd";

import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import OTPVerification from "./OTPVerification";
import { useAuth } from "./useAuth";

import "./ModalAuth.css";

const { Text, Title } = Typography;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (token: string) => void;
}

export default function ModalAuth({
    isOpen,
    onClose,
    onLoginSuccess,
}: Props) {
    const auth = useAuth(
        onLoginSuccess,
        onClose
    );

    const tabItems = [
        {
            key: "login",
            label: "Login",
            children: (
                <LoginForm
                    loading={auth.loading}
                    onSubmit={auth.handleLogin}
                />
            ),
        },
        {
            key: "register",
            label: "Sign Up",
            children: (
                <SignUpForm
                    loading={auth.loading}
                    onSubmit={auth.handleRegister}
                />
            ),
        },
    ];

    return (
        <Modal
            open={isOpen}
            onCancel={auth.handleClose}
            footer={null}
            centered
            destroyOnHidden
            width={440}
            className="auth-modal"
            maskClosable={!auth.loading}
        >
            {auth.step === "otp" ? (
                <OTPVerification
                    email={auth.tempEmail}
                    otp={auth.otp}
                    loading={auth.loading}
                    countdown={auth.countdown}
                    canRetry={auth.canRetry}
                    otpRefs={auth.otpRefs}
                    onOtpChange={
                        auth.handleOtpChange
                    }
                    onKeyDown={
                        auth.handleOtpKeyDown
                    }
                    onPaste={
                        auth.handleOtpPaste
                    }
                    onVerify={
                        auth.handleVerifyOTP
                    }
                    onRetry={auth.handleRetry}
                    onBack={() => {
                        auth.setMode("register");
                        auth.setMode("register");
                        auth.reset();
                    }}
                />
            ) : (
                <>
                    <div className="auth-modal-header">
                        <Title
                            level={2}
                            className="auth-title"
                        >
                            Welcome to Language Memory
                        </Title>

                        <Text
                            type="secondary"
                            className="auth-subtitle"
                        >
                            Learn smarter. Remember
                            longer.
                        </Text>
                    </div>

                    <Tabs
                        activeKey={auth.mode}
                        items={tabItems}
                        onChange={(key) =>
                            auth.setMode(
                                key as
                                | "login"
                                | "register"
                            )
                        }
                        centered
                        className="auth-tabs"
                    />
                </>
            )}
        </Modal>
    );
}