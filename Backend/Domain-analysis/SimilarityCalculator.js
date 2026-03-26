module.exports = function(a, b) {
    if (!a || !b) return 0;

    let matches = 0;
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
        if (a[i] === b[i]) matches++;
    }

    return Math.round((matches / Math.max(a.length, b.length)) * 100);
};