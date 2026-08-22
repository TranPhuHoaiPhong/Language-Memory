import React, { useEffect, useState } from "react";

import {
    CheckOutlined,
    CrownOutlined,
    EditOutlined,
    LogoutOutlined,
    MailOutlined,
    UserOutlined,
    BookOutlined,
    VideoCameraOutlined,
    ClockCircleOutlined,
    CloseOutlined,
} from "@ant-design/icons";

import {
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    Modal,
    Row,
    Space,
    Tag,
    Typography,
    message,
} from "antd";

import Navbar from "../../components/Navbar/Navbar";

import "./Dashboard.css";

const {
    Title,
    Text,
    Paragraph,
} = Typography;

function Dashboard() {

    // =========================================================
    // MESSAGE
    // =========================================================

    const [messageApi, contextHolder] =
        message.useMessage();


    // =========================================================
    // PROFILE STATE
    // =========================================================

    const [profile, setProfile] =
        useState({
            name: "Phong Tran",
            email: "phong@example.com",
        });


    // =========================================================
    // PLAN STATE
    // =========================================================

    const [currentPlan, setCurrentPlan] =
        useState("Free");


    // =========================================================
    // EDIT MODAL
    // =========================================================

    const [editModalOpen, setEditModalOpen] =
        useState(false);

    const [form] =
        Form.useForm();


    // =========================================================
    // ALWAYS SCROLL TO TOP
    // =========================================================

    useEffect(() => {

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
        });

    }, []);


    // =========================================================
    // USAGE
    // =========================================================

    const usage = [
        {
            icon: <BookOutlined />,
            value: "248",
            label: "Saved words",
        },
        {
            icon: <VideoCameraOutlined />,
            value: "37",
            label: "Videos watched",
        },
        {
            icon: <ClockCircleOutlined />,
            value: "18.5h",
            label: "Learning time",
        },
    ];


    // =========================================================
    // PLANS
    // =========================================================

    const plans = [
        {
            key: "free",
            name: "Free",
            price: "$0",
            description:
                "Get started with the basic language learning experience.",

            features: [
                "Save up to 100 words",
                "Bilingual subtitles",
                "Basic vocabulary review",
                "Basic pronunciation",
            ],
        },

        {
            key: "pro",
            name: "Pro",
            price: "$5",
            period: "/month",

            description:
                "Unlock the complete Language Memory experience.",

            popular: true,

            features: [
                "Unlimited vocabulary",
                "Unlimited videos",
                "Bilingual subtitles",
                "Advanced vocabulary review",
                "IPA pronunciation",
                "Personal folders",
                "Learning statistics",
            ],
        },
    ];


    // =========================================================
    // OPEN EDIT
    // =========================================================

    const openEditModal = () => {

        form.setFieldsValue({
            name: profile.name,
            email: profile.email,
        });

        setEditModalOpen(true);
    };


    // =========================================================
    // SAVE PROFILE
    // =========================================================

    const saveProfile = async () => {

        try {

            const values =
                await form.validateFields();

            setProfile({
                name: values.name,
                email: values.email,
            });

            setEditModalOpen(false);

            messageApi.success(
                "Profile updated successfully."
            );

        }
        catch (error) {

            console.error(error);

        }
    };


    // =========================================================
    // UPGRADE
    // =========================================================

    const handleUpgrade = () => {

        Modal.confirm({

            title: "Upgrade to Pro",

            icon: <CrownOutlined />,

            content:
                "You will be redirected to the payment page to complete your subscription.",

            okText: "Continue",

            cancelText: "Cancel",

            onOk: () => {

                messageApi.info(
                    "Payment integration will be connected here."
                );

            },

        });

    };


    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {

        Modal.confirm({

            title: "Log out?",

            content:
                "Are you sure you want to log out of your account?",

            okText: "Log out",

            cancelText: "Cancel",

            okButtonProps: {
                danger: true,
            },

            onOk: () => {

                messageApi.success(
                    "You have been logged out."
                );

                // TODO:
                // localStorage.removeItem("token");
                // navigate("/login");

            },

        });
    };


    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="profile-page">

            {contextHolder}

            <Navbar />


            <main className="profile-container">


                {/* =================================================
                    PROFILE HEADER
                ================================================= */}

                <section className="profile-header">

                    <div className="profile-user">

                        <Avatar
                            size={80}
                            icon={<UserOutlined />}
                            className="profile-avatar"
                        />

                        <div className="profile-user-info">

                            <div className="profile-name-row">

                                <Title
                                    level={2}
                                    className="profile-name"
                                >
                                    {profile.name}
                                </Title>

                                {currentPlan === "Pro" && (
                                    <Tag
                                        color="gold"
                                        icon={<CrownOutlined />}
                                    >
                                        PRO
                                    </Tag>
                                )}

                            </div>

                            <Text
                                type="secondary"
                                className="profile-email"
                            >
                                <MailOutlined />

                                {" "}

                                {profile.email}
                            </Text>

                        </div>

                    </div>


                    <Button
                        icon={<EditOutlined />}
                        onClick={openEditModal}
                    >
                        Edit profile
                    </Button>

                </section>


                {/* =================================================
                    ACCOUNT OVERVIEW
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title">

                        <Title level={3}>
                            Account overview
                        </Title>

                        <Text type="secondary">
                            Your learning activity
                        </Text>

                    </div>


                    <Row gutter={[16, 16]}>

                        {usage.map((item) => (

                            <Col
                                xs={24}
                                sm={8}
                                key={item.label}
                            >

                                <Card
                                    className="usage-card"
                                >

                                    <div className="usage-icon">

                                        {item.icon}

                                    </div>

                                    <div className="usage-value">

                                        {item.value}

                                    </div>

                                    <div className="usage-label">

                                        {item.label}

                                    </div>

                                </Card>

                            </Col>

                        ))}

                    </Row>

                </section>


                {/* =================================================
                    CURRENT PLAN
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title">

                        <Title level={3}>
                            Your plan
                        </Title>

                        <Text type="secondary">
                            Manage your Language Memory subscription
                        </Text>

                    </div>


                    <Card className="current-plan-card">

                        <div className="current-plan-left">

                            <div className="current-plan-icon">

                                <CrownOutlined />

                            </div>


                            <div>

                                <Text
                                    type="secondary"
                                    className="current-plan-label"
                                >
                                    CURRENT PLAN
                                </Text>

                                <Title
                                    level={3}
                                    className="current-plan-name"
                                >
                                    {currentPlan}
                                </Title>

                                <Paragraph
                                    type="secondary"
                                    className="current-plan-description"
                                >
                                    {currentPlan === "Free"
                                        ? "You are currently using the free Language Memory plan."
                                        : "You have access to all Pro features."
                                    }
                                </Paragraph>

                            </div>

                        </div>


                        {currentPlan === "Free" && (

                            <Button
                                type="primary"
                                size="large"
                                icon={<CrownOutlined />}
                                onClick={handleUpgrade}
                            >
                                Upgrade to Pro
                            </Button>

                        )}

                        {currentPlan === "Pro" && (

                            <Tag
                                color="gold"
                                className="active-plan-tag"
                            >
                                Active
                            </Tag>

                        )}

                    </Card>

                </section>


                {/* =================================================
                    PLANS
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title center">

                        <Title level={3}>
                            Choose your plan
                        </Title>

                        <Text type="secondary">
                            Start free and upgrade when you need more.
                        </Text>

                    </div>


                    <Row
                        gutter={[20, 20]}
                        justify="center"
                    >

                        {plans.map((plan) => (

                            <Col
                                xs={24}
                                md={12}
                                key={plan.key}
                            >

                                <Card
                                    className={
                                        `plan-card ${
                                            plan.popular
                                                ? "plan-card-popular"
                                                : ""
                                        }`
                                    }
                                >

                                    {plan.popular && (

                                        <div className="popular-badge">

                                            MOST POPULAR

                                        </div>

                                    )}


                                    <div className="plan-header">

                                        <div>

                                            <Title
                                                level={3}
                                                className="plan-name"
                                            >
                                                {plan.name}
                                            </Title>

                                            <Paragraph
                                                type="secondary"
                                                className="plan-description"
                                            >
                                                {plan.description}
                                            </Paragraph>

                                        </div>

                                    </div>


                                    <div className="plan-price">

                                        <span className="price">

                                            {plan.price}

                                        </span>

                                        {plan.period && (

                                            <span className="period">

                                                {plan.period}

                                            </span>

                                        )}

                                    </div>


                                    <Divider />


                                    <div className="plan-features">

                                        {plan.features.map(
                                            (feature) => (

                                                <div
                                                    className="plan-feature"
                                                    key={feature}
                                                >

                                                    <CheckOutlined />

                                                    <Text>
                                                        {feature}
                                                    </Text>

                                                </div>

                                            )
                                        )}

                                    </div>


                                    {plan.key === "free" && (

                                        <Button
                                            block
                                            size="large"
                                            disabled={
                                                currentPlan === "Free"
                                            }
                                        >
                                            {currentPlan === "Free"
                                                ? "Current plan"
                                                : "Free"
                                            }
                                        </Button>

                                    )}


                                    {plan.key === "pro" && (

                                        <Button
                                            block
                                            size="large"
                                            type="primary"
                                            icon={
                                                <CrownOutlined />
                                            }
                                            onClick={
                                                handleUpgrade
                                            }
                                            disabled={
                                                currentPlan === "Pro"
                                            }
                                        >
                                            {currentPlan === "Pro"
                                                ? "Current plan"
                                                : "Upgrade to Pro"
                                            }
                                        </Button>

                                    )}

                                </Card>

                            </Col>

                        ))}

                    </Row>

                </section>


                {/* =================================================
                    ACCOUNT SETTINGS
                ================================================= */}

                <section className="profile-section">

                    <div className="section-title">

                        <Title level={3}>
                            Account
                        </Title>

                        <Text type="secondary">
                            Manage your account
                        </Text>

                    </div>


                    <Card className="account-card">

                        <div className="account-row">

                            <div className="account-row-left">

                                <div className="account-row-icon">

                                    <UserOutlined />

                                </div>

                                <div>

                                    <Text strong>
                                        Personal information
                                    </Text>

                                    <div>
                                        <Text type="secondary">
                                            {profile.name}
                                        </Text>
                                    </div>

                                </div>

                            </div>


                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={
                                    openEditModal
                                }
                            >
                                Edit
                            </Button>

                        </div>


                        <Divider />


                        <div className="account-row">

                            <div className="account-row-left">

                                <div className="account-row-icon">

                                    <MailOutlined />

                                </div>

                                <div>

                                    <Text strong>
                                        Email address
                                    </Text>

                                    <div>
                                        <Text type="secondary">
                                            {profile.email}
                                        </Text>
                                    </div>

                                </div>

                            </div>

                        </div>


                        <Divider />


                        <div className="account-row">

                            <div className="account-row-left">

                                <div className="account-row-icon">

                                    <LogoutOutlined />

                                </div>

                                <div>

                                    <Text strong>
                                        Sign out
                                    </Text>

                                    <div>
                                        <Text type="secondary">
                                            Sign out from this device.
                                        </Text>
                                    </div>

                                </div>

                            </div>


                            <Button
                                danger
                                onClick={
                                    handleLogout
                                }
                            >
                                Sign out
                            </Button>

                        </div>

                    </Card>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="profile-footer">

                    <Text type="secondary">
                        © 2026 Language Memory
                    </Text>

                    <Text type="secondary">
                        Learn. Remember. Improve.
                    </Text>

                </footer>

            </main>


            {/* =================================================
                EDIT PROFILE MODAL
            ================================================= */}

            <Modal
                open={editModalOpen}
                title="Edit profile"
                okText="Save changes"
                cancelText="Cancel"
                onCancel={() =>
                    setEditModalOpen(false)
                }
                onOk={saveProfile}
                destroyOnClose
            >

                <Form
                    form={form}
                    layout="vertical"
                >

                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter your name.",
                            },
                        ]}
                    >

                        <Input
                            prefix={
                                <UserOutlined />
                            }
                        />

                    </Form.Item>


                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            {
                                required: true,
                                message:
                                    "Please enter your email.",
                            },
                            {
                                type: "email",
                                message:
                                    "Please enter a valid email.",
                            },
                        ]}
                    >

                        <Input
                            prefix={
                                <MailOutlined />
                            }
                        />

                    </Form.Item>

                </Form>

            </Modal>

        </div>
    );
}

export default Dashboard;