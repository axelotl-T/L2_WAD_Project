const express = require("express");
const app = express();
const port = 3000;
const routes = require("./routes.js");
const cors = require("cors");
const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Serve the frontend views
app.use(express.static("views"));

// IMPORTANT: Serve the public folder for CSS/JS
app.use(express.static("public"));

app.use("/", routes);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
