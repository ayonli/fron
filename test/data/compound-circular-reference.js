{
  abc: {
    prop1: "Hello, World",
    prop2: [
      "Hi, Ayon",
      Reference("abc.prop2")
    ],
    prop3: Reference("abc")
  },
  def: Reference("")
}