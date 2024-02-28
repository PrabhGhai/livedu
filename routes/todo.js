const router = require("express").Router();
const { authenticateToken } = require("./userAuth");
const Todo = require("../Models/todo");
const User = require("../Models/user");

//creating todo for a particular person
router.post("/create-todo", authenticateToken, async (req, res) => {
  try {
    const { desc } = req.body;
    const { id } = req.headers;
    const todo = new Todo({ desc: desc, user: id });
    const getTodo = await todo.save();
    //getting ID of todo to save ID  to the userSchema
    const todoId = getTodo._id;
    await User.findByIdAndUpdate(id, { $push: { todo: todoId } });
    return res.json({
      status: "Success",
      message: "Task created",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "Internal server error",
    });
  }
});

//getting all todos of a particular person
router.get("/getAll-todos", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const user = await User.findById(id).populate({
      path: "todo",
      options: { sort: { createdAt: -1 } },
    });
    return res.json({ data: user.todo });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "Internal server error",
    });
  }
});

//delete todo
router.delete("/delete-todo/:id", authenticateToken, async (req, res) => {
  try {
    //getting user ID
    const { id } = req.headers;
    //getting Todo ID
    const todoId = req.params.id;
    const deletedTodo = await Todo.findByIdAndDelete(todoId);
    if (!deletedTodo) {
      return res.status(404).json({
        status: "Error",
        message: "Todo not found",
      });
    }
    await User.findByIdAndUpdate(id, { $pull: { todo: todoId } });
    return res.status(200).json({
      status: "Success",
      message: "Todo deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
