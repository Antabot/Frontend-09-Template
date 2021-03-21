# 学习笔记

本周主要学习字符串分析算法。

## 1 字典树

![trie](https://img-blog.csdnimg.cn/20210321231230343.png#pic_center)

Hash 树的一种特殊应用，把字符串按树型结构存储，适用场景包括：

- 字符串检索，实际应用比如快速查找是否存在违规词
- 文本联想，前缀模糊搜索
- 拼写检查
- 词频统计
- 按字典序排序（需要在插入时做一些处理）
- 查找字符串最长公共前缀

课程中的实现方式是节点索引代表字符，节点值为空对象，终结节点的值为字符串出现个数。

技巧：

- 使用 Symbol 代替字符 `$` 作为终结符
- for of 遍历 value，for in 遍历下标

## 2 KMP 算法

KMP 算法是一种时间复杂度为 O(m) 的字符串匹配算法（m 为源串长度）。

该算法的核心是根据模式串获得跳转表格（或称前缀表），该表格可视为一个有限状态机。

算出表格后，可以在匹配的过程中先验地获取字符串的重复信息，做到源串 “不走寻常路”。

![跳转表格](https://img-blog.csdnimg.cn/20210321231406766.png#pic_center)


另外一种实现思路是利用状态转移图替代跳转表格。即 dp[状态][字符] = 下个状态

参考 leetcode 第 28 题题解：

```js
public class KMP {
    private int[][] dp;
    private String pat;

    public KMP(String pat) {
        this.pat = pat;
        int M = pat.length();
        // dp[状态][字符] = 下个状态
        dp = new int[M][256];
        // base case
        dp[0][pat.charAt(0)] = 1;
        // 影子状态 X 初始为 0
        int X = 0;
        // 构建状态转移图（稍改的更紧凑了）
        for (int j = 1; j < M; j++) {
            for (int c = 0; c < 256; c++) {
                dp[j][c] = dp[X][c];
            dp[j][pat.charAt(j)] = j + 1;
            // 更新影子状态
            X = dp[X][pat.charAt(j)];
        }
    }

    public int search(String txt) {
        int M = pat.length();
        int N = txt.length();
        // pat 的初始态为 0
        int j = 0;
        for (int i = 0; i < N; i++) {
            // 计算 pat 的下一个状态
            j = dp[j][txt.charAt(i)];
            // 到达终止态，返回结果
            if (j == M) return i - M + 1;
        }
        // 没到达终止态，匹配失败
        return -1;
    }
}
```

## 3 Wildcard Matching

手动实现一个可以使用通配符（* and ?）的匹配算法（leetcode 44 题）。

课程中的核心的思路是按通配符位置分段，最后一个 * 尽可能多匹配，前面的 * 尽可能少匹配。

![wildcard](https://img-blog.csdnimg.cn/20210321233606448.png#pic_center)


技巧：

- 使用 reg.exec() 提高正则执行效率


也可以使用动态规划思想，dp[i][j] 的值代表 source 的前 i 个与 pattern 的前 j 个是否匹配，重点依然在通配符 * 的处理。