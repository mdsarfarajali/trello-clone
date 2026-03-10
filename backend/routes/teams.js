const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Team = require("../models/Team");
const TeamStep = require("../models/TeamStep");
const TeamTask = require("../models/TeamTask");
const TeamMessage = require("../models/TeamMessage");

// Helper: check if user is a member of the team
const isMember = (team, userId) =>
  team.members.some((m) => m.user.toString() === userId.toString());

// Helper: check if user is the leader
const isLeader = (team, userId) =>
  team.leader.toString() === userId.toString();

// ─── POST /api/teams — Create a new team ───
router.post("/", auth, async (req, res) => {
  try {
    const { teamName, teamGoal } = req.body;
    if (!teamName || !teamGoal) {
      return res
        .status(400)
        .json({ message: "Team name and goal are required" });
    }

    const team = new Team({
      teamName,
      teamGoal,
      leader: req.user._id,
      members: [{ user: req.user._id, role: "leader" }],
    });
    await team.save();

    const populated = await Team.findById(team._id)
      .populate("leader", "name email avatarColor initials")
      .populate("members.user", "name email avatarColor initials");

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/teams/join — Join a team with code + passkey ───
router.post("/join", auth, async (req, res) => {
  try {
    const { teamCode, passKey } = req.body;
    if (!teamCode || !passKey) {
      return res
        .status(400)
        .json({ message: "Team code and passkey are required" });
    }

    const team = await Team.findOne({ teamCode: teamCode.toUpperCase() });
    if (!team || team.passKey !== passKey) {
      return res.status(404).json({ message: "Invalid team code or passkey" });
    }

    if (isMember(team, req.user._id)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this team" });
    }

    team.members.push({ user: req.user._id, role: "member" });
    await team.save();

    const populated = await Team.findById(team._id)
      .populate("leader", "name email avatarColor initials")
      .populate("members.user", "name email avatarColor initials");

    // Emit socket event
    const io = req.app.get("io");
    if (io) io.to(`team:${team._id}`).emit("memberJoined", populated);

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/teams/my — List current user's teams ───
router.get("/my", auth, async (req, res) => {
  try {
    const teams = await Team.find({ "members.user": req.user._id })
      .populate("leader", "name email avatarColor initials")
      .populate("members.user", "name email avatarColor initials")
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/teams/:id — Get full team data ───
router.get("/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("leader", "name email avatarColor initials")
      .populate("members.user", "name email avatarColor initials");

    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isMember(team, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const steps = await TeamStep.find({ team: team._id }).sort({ order: 1 });
    const tasks = await TeamTask.find({
      step: { $in: steps.map((s) => s._id) },
    }).sort({ createdAt: 1 });

    // Group tasks by step
    const stepsWithTasks = steps.map((step) => ({
      ...step.toObject(),
      tasks: tasks.filter((t) => t.step.toString() === step._id.toString()),
    }));

    res.json({ team, steps: stepsWithTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/teams/:id/steps — Add a step (leader only) ───
router.post("/:id/steps", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res.status(403).json({ message: "Only the leader can add steps" });
    }

    const { stepName } = req.body;
    if (!stepName) {
      return res.status(400).json({ message: "Step name is required" });
    }

    const count = await TeamStep.countDocuments({ team: team._id });
    const step = new TeamStep({
      team: team._id,
      stepName,
      order: count,
    });
    await step.save();

    const io = req.app.get("io");
    if (io) io.to(`team:${team._id}`).emit("teamStepCreated", step);

    res.status(201).json(step);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT /api/teams/:id/steps/:stepId — Update step (leader only) ───
router.put("/:id/steps/:stepId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can update steps" });
    }

    const step = await TeamStep.findById(req.params.stepId);
    if (!step || step.team.toString() !== team._id.toString()) {
      return res.status(404).json({ message: "Step not found" });
    }

    if (req.body.stepName !== undefined) step.stepName = req.body.stepName;
    if (req.body.status !== undefined) step.status = req.body.status;
    await step.save();

    const io = req.app.get("io");
    if (io) io.to(`team:${team._id}`).emit("teamStepUpdated", step);

    res.json(step);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /api/teams/:id/steps/:stepId — Delete step + tasks (leader only) ───
router.delete("/:id/steps/:stepId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can delete steps" });
    }

    const step = await TeamStep.findById(req.params.stepId);
    if (!step || step.team.toString() !== team._id.toString()) {
      return res.status(404).json({ message: "Step not found" });
    }

    await TeamTask.deleteMany({ step: step._id });
    await TeamStep.findByIdAndDelete(step._id);

    const io = req.app.get("io");
    if (io)
      io.to(`team:${team._id}`).emit("teamStepDeleted", {
        stepId: step._id,
      });

    res.json({ message: "Step deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/teams/:id/steps/:stepId/tasks — Add task (leader only) ───
router.post("/:id/steps/:stepId/tasks", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can add tasks" });
    }

    const step = await TeamStep.findById(req.params.stepId);
    if (!step || step.team.toString() !== team._id.toString()) {
      return res.status(404).json({ message: "Step not found" });
    }

    const { taskName } = req.body;
    if (!taskName) {
      return res.status(400).json({ message: "Task name is required" });
    }

    const task = new TeamTask({ step: step._id, taskName });
    await task.save();

    const io = req.app.get("io");
    if (io) io.to(`team:${team._id}`).emit("teamTaskCreated", task);

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUT /api/teams/:id/tasks/:taskId — Update task (leader only) ───
router.put("/:id/tasks/:taskId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can update tasks" });
    }

    const task = await TeamTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Verify task belongs to a step in this team
    const step = await TeamStep.findById(task.step);
    if (!step || step.team.toString() !== team._id.toString()) {
      return res.status(404).json({ message: "Task not found in this team" });
    }

    if (req.body.taskName !== undefined) task.taskName = req.body.taskName;
    if (req.body.status !== undefined) task.status = req.body.status;
    await task.save();

    const io = req.app.get("io");
    if (io) io.to(`team:${team._id}`).emit("teamTaskUpdated", task);

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /api/teams/:id/tasks/:taskId — Delete task (leader only) ───
router.delete("/:id/tasks/:taskId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can delete tasks" });
    }

    const task = await TeamTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const step = await TeamStep.findById(task.step);
    if (!step || step.team.toString() !== team._id.toString()) {
      return res.status(404).json({ message: "Task not found in this team" });
    }

    await TeamTask.findByIdAndDelete(task._id);

    const io = req.app.get("io");
    if (io)
      io.to(`team:${team._id}`).emit("teamTaskDeleted", {
        taskId: task._id,
        stepId: step._id,
      });

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /api/teams/:id/members/:userId — Remove member (leader only) ───
router.delete("/:id/members/:userId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can remove members" });
    }

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Leader cannot remove themselves" });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== req.params.userId,
    );
    await team.save();

    const populated = await Team.findById(team._id)
      .populate("leader", "name email avatarColor initials")
      .populate("members.user", "name email avatarColor initials");

    const io = req.app.get("io");
    if (io) {
      io.to(`team:${team._id}`).emit("memberRemoved", {
        team: populated,
        removedUserId: req.params.userId,
      });
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /api/teams/:id — Delete entire team (leader only) ───
router.delete("/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isLeader(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the leader can delete the team" });
    }

    // Cascade delete all related data
    const steps = await TeamStep.find({ team: team._id });
    const stepIds = steps.map((s) => s._id);
    await TeamTask.deleteMany({ step: { $in: stepIds } });
    await TeamStep.deleteMany({ team: team._id });
    await TeamMessage.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    const io = req.app.get("io");
    if (io)
      io.to(`team:${team._id}`).emit("teamDeleted", { teamId: team._id });

    res.json({ message: "Team deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/teams/:id/messages — Get chat history ───
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isMember(team, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await TeamMessage.find({ team: team._id })
      .populate("sender", "name avatarColor initials")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/teams/:id/messages — Send a message ───
router.post("/:id/messages", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!isMember(team, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = new TeamMessage({
      team: team._id,
      sender: req.user._id,
      content: content.trim(),
    });
    await message.save();

    const populated = await TeamMessage.findById(message._id).populate(
      "sender",
      "name avatarColor initials",
    );

    const io = req.app.get("io");
    if (io) io.to(`team:${team._id}`).emit("teamMessage", populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
