{
  abc: {
    prop1: "Hello, World",
    prop2: [
      "Hi, Ayon",
      [
        "Hello, World!"
      ],
      $.abc.prop2[1]
    ]
  },
  def: $.abc,
  ghi: $.abc.prop2
}