import {
    Button,
    Input,
    Space,
    Typography,
} from "antd";

import {
    ReloadOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface Props {
    email: string;
    otp: string;

    loading: boolean;
    countdown: number;
    canRetry: boolean;

    otpRefs: React.MutableRefObject<
        (HTMLInputElement | null)[]
    >;

    onOtpChange: (
        index: number,
        value: string
    ) => void;

    onKeyDown: (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => void;

    onPaste: (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => void;

    onVerify: () => void;
    onRetry: () => void;
    onBack: () => void;
}

export default function OTPVerification({
    email,
    otp,
    loading,
    countdown,
    canRetry,
    otpRefs,
    onOtpChange,
    onKeyDown,
    onPaste,
    onVerify,
    onRetry,
    onBack,
}: Props) {
    return (
        <div className="otp-section">
            <div className="otp-header">
                <SafetyCertificateOutlined className="otp-icon" />

                <Title level={3}>
                    Verify your email
                </Title>

                <Text type="secondary">
                    We sent a 6-digit verification
                    code to
                </Text>

                <br />

                <Text strong>{email}</Text>
            </div>

            <Space
                className="otp-input-group"
                size="middle"
            >
                {Array.from({
                    length: 6,
                }).map((_, index) => (
                    <Input
                        key={index}
                        ref={(element) => {
                            otpRefs.current[index] =
                                element?.input || null;
                        }}
                        className="otp-input-box"
                        value={
                            otp[index] || ""
                        }
                        maxLength={1}
                        inputMode="numeric"
                        disabled={loading}
                        onChange={(e) =>
                            onOtpChange(
                                index,
                                e.target.value
                            )
                        }
                        onKeyDown={(e) =>
                            onKeyDown(index, e)
                        }
                        onPaste={
                            index === 0
                                ? onPaste
                                : undefined
                        }
                    />
                ))}
            </Space>

            <div className="otp-actions">
                <Button
                    type="primary"
                    size="large"
                    block
                    loading={loading}
                    disabled={otp.length !== 6}
                    onClick={onVerify}
                >
                    Verify Code
                </Button>

                {!canRetry ? (
                    <Text
                        type="secondary"
                        className="countdown-text"
                    >
                        Resend code in{" "}
                        <b>{countdown}s</b>
                    </Text>
                ) : (
                    <Button
                        type="link"
                        icon={<ReloadOutlined />}
                        loading={loading}
                        onClick={onRetry}
                    >
                        Resend Code
                    </Button>
                )}
            </div>

            <Button
                type="link"
                block
                disabled={loading}
                onClick={onBack}
            >
                Back to Sign Up
            </Button>
        </div>
    );
}