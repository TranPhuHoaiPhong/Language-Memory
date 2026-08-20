import {
    Button,
    Form,
    Input,
    Typography,
} from "antd";

import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    MailOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface RegisterFormValues {
    email: string;
    password: string;
    confirmPassword: string;
}

interface Props {
    loading: boolean;
    onSubmit: (
        email: string,
        password: string
    ) => void;
}

export default function SignUpForm({
    loading,
    onSubmit,
}: Props) {
    const [form] =
        Form.useForm<RegisterFormValues>();

    const password =
        Form.useWatch("password", form) || "";

    const isPasswordValid =
        password.length >= 6;

    const handleFinish = (
        values: RegisterFormValues
    ) => {
        if (
            values.password !==
            values.confirmPassword
        ) {
            return;
        }

        onSubmit(
            values.email,
            values.password
        );
    };

    return (
        <Form<RegisterFormValues>
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            size="large"
            validateTrigger="onBlur"
        >
            <Form.Item
                name="email"
                label="Email"
                rules={[
                    {
                        required: true,
                        message:
                            "Please enter your email",
                    },
                    {
                        type: "email",
                        message:
                            "Please enter a valid email",
                    },
                ]}
            >
                <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email"
                    disabled={loading}
                />
            </Form.Item>

            <Form.Item
                name="password"
                label="Password"
                rules={[
                    {
                        required: true,
                        message:
                            "Please enter your password",
                    },
                    {
                        min: 6,
                        message:
                            "Password must be at least 6 characters",
                    },
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Create a password (min 6 characters)"
                    disabled={loading}
                    iconRender={(visible) =>
                        visible ? (
                            <EyeOutlined />
                        ) : (
                            <EyeInvisibleOutlined />
                        )
                    }
                />
            </Form.Item>

            <div className="password-requirements-wrapper">
                {password && (
                    <div className="password-requirements">
                        <Text
                            className={
                                isPasswordValid
                                    ? "met"
                                    : "unmet"
                            }
                        >
                            {isPasswordValid ? (
                                <CheckCircleOutlined />
                            ) : (
                                <CloseCircleOutlined />
                            )}

                            {" At least 6 characters"}
                        </Text>
                    </div>
                )}
            </div>

            <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                    {
                        required: true,
                        message:
                            "Please confirm your password",
                    },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (
                                !value ||
                                getFieldValue(
                                    "password"
                                ) === value
                            ) {
                                return Promise.resolve();
                            }

                            return Promise.reject(
                                new Error(
                                    "Passwords do not match"
                                )
                            );
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Confirm your password"
                    disabled={loading}
                    iconRender={(visible) =>
                        visible ? (
                            <EyeOutlined />
                        ) : (
                            <EyeInvisibleOutlined />
                        )
                    }
                />
            </Form.Item>

            <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                disabled={!isPasswordValid}
            >
                Sign Up
            </Button>
        </Form>
    );
}