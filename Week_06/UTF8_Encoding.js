function UTF8_Encoding(string) {
    return Buffer.from(string, "utf8");
}

console.log(UTF8_Encoding("Hello World"));
console.log(UTF8_Encoding("我爱我家"));