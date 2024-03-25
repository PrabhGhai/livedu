const router = require("express").Router();
const Category = require("../Models/categoriesModel");

//create Category
router.post("/add-catgeory", async (req, res) => {
  try {
    const { title, img } = req.body;
    const cat = new Category({ title: title, img: img });
    await cat.save();
    return res.json({
      status: "Success",
      message: "Category created",
    });
  } catch (error) {
    res.status(400).json({
      status: "Error",
      message: "Internal server error",
    });
  }
});

router.get("/get-all-catgeory", async (req, res) => {
  try {
    const data = await Category.find();
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    res.status(400).json({
      status: "Error",
      message: "Internal server error",
    });
  }
});
module.exports = router;
