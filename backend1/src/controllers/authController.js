const User = require("../models/User");

exports.saveGoogleUser = async (req, res) => {
    try {
        const { uid, email, displayName, photoURL } = req.body;

        if (!uid) {
            return res.status(400).json({
                success: false,
                message: "Thiếu uid"
            });
        }

        const user = await User.findOneAndUpdate(
            { uid },
            { uid, email, displayName, photoURL, provider: "google" },
            { new: true, upsert: true }
        );

        console.log("Đã lưu user lên server:", user);

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
