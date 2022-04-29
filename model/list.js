const mongoose = require('mongoose');

// Create schema
const List = mongoose.model('List', {
    content: {
        type: String,
        required: true
    },
    userid: {
        type: String,
        required: true
    },
});

module.exports = List;