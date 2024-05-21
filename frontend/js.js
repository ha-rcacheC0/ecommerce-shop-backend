function getFirstTenNumbers() {
  // Your code goes here...
  let array = [];

  for (let i = 1; i <= 10; i++) {
    if (i < array.length) {
      return array.push(array[i]);
    }
  }
return array;
}
getFirstTenNumbers();

console.log(array);