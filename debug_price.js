const input = "696969";
const parsed = parseInt(input);
console.log(`Input: "${input}", Parsed: ${parsed}`);

const input2 = "696969.99";
const parsed2 = parseInt(input2);
console.log(`Input: "${input2}", Parsed: ${parsed2}`);

const input3 = 696969;
console.log(`Input (number): ${input3}, Result: ${input3}`);

// Simulate store logic
const product = { price: parsed };
console.log("Sending to backend:", product.price);
