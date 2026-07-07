const mongoose = require("mongoose");

const subtitleItemSchema = new mongoose.Schema(
    {
        start: {
            type: Number,
            required: true
        },

        end: {
            type: Number,
            required: true
        },

        original: {
            type: String,
            required: true
        },

        translated: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
);

const subtitleCacheSchema = new mongoose.Schema(
    {
        videoId: {
            type: String,
            required: true,
            trim: true
        },

        sourceLanguage: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        language: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        subtitle: {
            type: [subtitleItemSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);

subtitleCacheSchema.index(
    {
        videoId: 1,
        sourceLanguage: 1,
        language: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "SubtitleCache",
    subtitleCacheSchema
);