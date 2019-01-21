{
  abc: {
    prop1: "Hello, World",
    prop2: [
      "Hi, Ayon",
      [
        "Hello, World!"
      ],
      Reference("abc.prop2[1]")
    ]
  },
  def: Reference("abc"),
  ghi: Reference("abc.prop2")
}