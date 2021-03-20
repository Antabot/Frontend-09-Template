function kmp(source, pattern) {
    let table = new Array(pattern.length).fill(0);

    // i 为（当前）自重复串开始的位置，至少要从 1 开始才称的上重复，从 0 开始判断整个串必然是跟自己重复的
    // j 为已重复的字数，等价于当前需要判断的匹配点的位置
    {
        let i = 1, j = 0;

        while(i < pattern.length) {
            if(pattern[i] === pattern[j]) {
                i++;
                j++;
                if(i < pattern.length) table[i] = j;
            } else {
                if(j > 0) {
                    j = table[j];
                }
                else {
                    ++i;
                }
            }
        }
    }

    console.log(table);

    {
        // i 是 source 的位置，j 是 pattern 的位置
        let i = 0, j = 0;
        while(i < source.length) {
            console.log(pattern[j], source[i]);
            if(pattern[j] === source[i]) {
                i++, j++;
            } else {
                if(j > 0) {
                    j = table[j];
                } else {
                    i++;
                }
            }
            if(j === pattern.length) return true;
        }
        return false;
    }
}

console.log(kmp("aaa", "aa"));