var buf = Buffer.from("hello, world");

console.log(buf.buffer)
for (let item of buf) {
    console.log(item);
}