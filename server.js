const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.get("/api/products", (req, res) => {
  res.json([
    {
      id: 1,
      title: "لبنیات",
      img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhCZe0e0hWp5eEvMfEsXrAJnl-AxE4IXDOAQ&s',
      subMenu: [
        {
          id: 11,
          title: "شیر",
          img:'',
          subMenu: [
            {
              id: 111,
              title: "شیر پاستوریزه",
              img:'',
            },
            {
              id: 112,
              title: "شیر استریلیزه",
             img:'',
            },
          ],
        },
        {
          id: 12,
          title: "پنیر",
          img:'',
          subMenu: [
            {
              id: 121,
              title: "پنیر سفید",
              img:'',
            },
          ],
        },
      ],
    },
    {
      id: 2,
      title: "گوشت و پروتئین",
      img:'',
      subMenu: [
        {
          id: 21,
          title: "گوشت قرمز",
          img:'',
          subMenu: [
            {
              id: 211,
              title: "گوشت گوسفندی",
              img:'',
            },
            {
              id: 212,
              title: "گوشت گوساله",
             img:'',
            },
          ],
        },
        {
          id: 22,
          title: "مرغ",
          img:'',
          subMenu: [
            {
              id: 221,
              title: "ران مرغ",
             img:'',
            },
          ],
        },
      ],
    },
    {
      id: 3,
      title: "نوشیدنی‌ها",
      img:'',
      subMenu: [
        {
          id: 31,
          title: "نوشیدنی‌های گرم",
          img:'',
        },
        {
          id: 32,
          title: "نوشیدنی‌های سرد",
          img:'',
          subMenu: [
            {
              id: 321,
              title: "آبمیوه",
              img:'',
            },
          ],
        },
      ],
    },
    {
      id: 4,
      title: "خشکبار و آجیل",
      img:'',
      subMenu: [
        {
          id: 41,
          title: "آجیل",
         img:'',
        },
        {
          id: 42,
          title: "میوه خشک",
          img:'',
        },
      ],
    },
  ]);
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
