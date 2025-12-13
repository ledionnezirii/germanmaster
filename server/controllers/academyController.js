const Academy = require("../models/Academy")
const User = require("../models/User")

// Create Academy
exports.createAcademy = async (req, res) => {
  try {
    const { name, description } = req.body
    const userId = req.user.id

    // Check if user role is academy
    const user = await User.findById(userId)
    if (user.role !== "academyAdmin" && user.role !== "admin") {
  return res.status(403).json({
    success: false,
    message: "Only academy accounts can create academies",
  })
}

    const academy = await Academy.create({
      name,
      description,
      owner: userId,
    })

    res.status(201).json({
      success: true,
      data: academy,
      message: "Academy created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Get all academies for the logged-in user
exports.getMyAcademies = async (req, res) => {
  try {
    const userId = req.user.id

    const academies = await Academy.find({
      $or: [{ owner: userId }, { "groups.admin": userId }, { "groups.members": userId }],
    }).populate("owner", "emri mbiemri email")

    res.status(200).json({
      success: true,
      data: academies,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Get single academy
exports.getAcademy = async (req, res) => {
  try {
    const { academyId } = req.params

    const academy = await Academy.findById(academyId)
      .populate("owner", "emri mbiemri email")
      .populate("groups.admin", "emri mbiemri email xp level avatarStyle")
      .populate("groups.members", "emri mbiemri email xp level avatarStyle")

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    res.status(200).json({
      success: true,
      data: academy,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Create Group
exports.createGroup = async (req, res) => {
  try {
    const { academyId } = req.params
    const { name, description } = req.body
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    // Only academy owner or admins can create groups
    if (academy.owner.toString() !== userId) {
  const user = await User.findById(userId)
  if (user.role !== "admin" && user.role !== "academyAdmin") {  // Add this check
    return res.status(403).json({
      success: false,
      message: "You don't have permission to create groups",
    })
  }
}

    const newGroup = {
      name,
      description,
      admin: userId,
      members: [],
      tasks: [],
      invitations: [],
    }

    academy.groups.push(newGroup)
    await academy.save()

    res.status(201).json({
      success: true,
      data: academy,
      message: "Group created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Invite students to group
exports.inviteToGroup = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const { email } = req.body
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is group admin
    if (group.admin.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can invite students",
      })
    }

    // Check if already invited
    const alreadyInvited = group.invitations.find((inv) => inv.email === email)
    if (alreadyInvited) {
      return res.status(400).json({
        success: false,
        message: "User already invited",
      })
    }

    group.invitations.push({
      email,
      status: "pending",
    })

    await academy.save()

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/academy/join/${academyId}/${groupId}?email=${encodeURIComponent(email)}`

    res.status(200).json({
      success: true,
      data: academy,
      inviteLink,
      message: "Invitation sent successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Accept group invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const userId = req.user.id

    const user = await User.findById(userId)
    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Find invitation
    const invitation = group.invitations.find((inv) => inv.email === user.email && inv.status === "pending")

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "No pending invitation found",
      })
    }

    // Add user to group members
    if (!group.members.includes(userId)) {
      group.members.push(userId)
    }

    invitation.status = "accepted"

    await academy.save()

    res.status(200).json({
      success: true,
      data: academy,
      message: "Joined group successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const { title, description, xpReward, dueDate } = req.body
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is group admin
    if (group.admin.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only group admin can create tasks",
      })
    }

    const newTask = {
      title,
      description,
      xpReward: xpReward || 50,
      dueDate,
      createdBy: userId,
      completedBy: [],
    }

    group.tasks.push(newTask)
    await academy.save()

    res.status(201).json({
      success: true,
      data: academy,
      message: "Task created successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Complete Task
exports.completeTask = async (req, res) => {
  try {
    const { academyId, groupId, taskId } = req.params
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is member of the group
    if (!group.members.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      })
    }

    const task = group.tasks.id(taskId)

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      })
    }

    // Check if already completed
    const alreadyCompleted = task.completedBy.find((comp) => comp.userId.toString() === userId)

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Task already completed",
      })
    }

    // Add to completed
    task.completedBy.push({
      userId,
      completedAt: new Date(),
    })

    await academy.save()

    // Award XP to user
    const user = await User.findById(userId)
    user.xp += task.xpReward
    user.weeklyXp += task.xpReward
    user.monthlyXp += task.xpReward
    await user.save()

    res.status(200).json({
      success: true,
      data: academy,
      message: `Task completed! You earned ${task.xpReward} XP`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Get group leaderboard
exports.getGroupLeaderboard = async (req, res) => {
  try {
    const { academyId, groupId } = req.params

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Get all members with their stats
    const members = await User.find({
      _id: { $in: group.members },
    }).select("emri mbiemri email xp level avatarStyle")

    // Sort by XP
    const leaderboard = members.sort((a, b) => b.xp - a.xp)

    res.status(200).json({
      success: true,
      data: leaderboard,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Delete Group
exports.deleteGroup = async (req, res) => {
  try {
    const { academyId, groupId } = req.params
    const userId = req.user.id

    const academy = await Academy.findById(academyId)

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Check if user is group admin or academy owner
    if (group.admin.toString() !== userId && academy.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this group",
      })
    }

    group.remove()
    await academy.save()

    res.status(200).json({
      success: true,
      data: academy,
      message: "Group deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Get group info for invitation
exports.getGroupInviteInfo = async (req, res) => {
  try {
    const { academyId, groupId } = req.params

    const academy = await Academy.findById(academyId).populate("owner", "emri mbiemri email")

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: "Academy not found",
      })
    }

    const group = academy.groups.id(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        academyName: academy.name,
        academyDescription: academy.description,
        groupName: group.name,
        groupDescription: group.description,
        memberCount: group.members.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
