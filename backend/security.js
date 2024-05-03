function sanitizeInput(input) {
    // Replace special characters with their HTML entity equivalents
    return input.replace(/[&<>"']/g, function(match) {
        switch(match) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return match;
        }
    });
}
module.exports = {
    sanitize: sanitizeInput
};
