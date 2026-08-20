import {
    Button,
    Form,
    Input,
} from "antd";

import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    MailOutlined,
} from "@ant-design/icons";

interface LoginFormValues {
    email: string;
    password: string;
}

interface Props {
    loading: boolean;
    onSubmit: (
        email: string,
        password: string
    ) => void;
}

export default function LoginForm({
    loading,
    onSubmit,
}: Props) {
    const [form] = Form.useForm<LoginFormValues>();

    const handleFinish = (
        values: LoginFormValues
    ) => {
        onSubmit(
            values.email,
            values.password
        );
    };

    return (
        <Form<LoginFormValues>
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
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter your password"
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
            >
                Login
            </Button>
        </Form>
    );
}