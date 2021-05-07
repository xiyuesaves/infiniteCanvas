let prohibitedWords = ["测试"]; // 违禁词列表
// 检查违禁词
function checkProhibitedWords(name) {
    for (let i = 0; i < prohibitedWords.length; i++) {
        if (name.includes(prohibitedWords[i])) {
            return false;
        };
    };
    return true;
}