const prisma = require("../db/prisma");

async function getUserAnalytics(req, res) {
  const userId = parseInt(req.params?.id);

  if (isNaN(userId)) {
    return res.status(400).send();
  }
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!existingUser) {
    return res.status(404).json({
      message: "user not found"
    });
  }

  const taskStats = await prisma.task.groupBy({
    by: ["isCompleted"],
    where: {
      userId: userId
    },
    _count: {
      id: true
    }
  });

  const recentTasks = await prisma.task.findMany({
    where: {
      userId: userId
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true,
      User: {
        select: {
          name: true
        }
      }
    },

    orderBy: {createdAt: "desc"},
    take: 10
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyProgress = await prisma.task.groupBy({
    by: ["createdAt"],
    where: {
      userId,
      createdAt: {
        gte: oneWeekAgo
      }
    },
    _count: {
      id: true
    }
  });

  return res.status(200).json({taskStats, recentTasks, weeklyProgress});
}
async function getUsersWithStats(req, res) {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  const usersRaw = await prisma.user.findMany({
    include: {
      Task: {
        where: {
          isCompleted: false
        },
        select: {id: true},
        take: 5
      },
      _count: {
        select: {
          Task: true
        }
      }
    },

    skip: skip,
    take: limit,
    orderBy: {createdAt: "desc"}
  });

  const users = usersRaw.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    _count: user._count,
    Task: user.Task
  }));

  const totalTasks = await prisma.task.count();

  const pagination = {
    page: page,
    limit: limit,
    totalTask: totalTasks,
    pages: Math.ceil(page * limit),
    hasNext: limit * page < totalTasks,
    hasPrev: page > 1
  };
  return res.status(200).json({users, pagination});
}
async function searchTasks(req, res) {
  const limit = parseInt(req.query.limit) || 20;

  if (!req.query.q || req.query.q.trim().length < 2) {
    return res.status(400).send();
  }

  const searchQuery = req.query.q;

  const searchPattern = `%${searchQuery}%`;
  const exactMatch = `${searchQuery}`;
  const startsWith = `${searchQuery}%`;

  const results = await prisma.$queryRaw`
SELECT 
t.id,
t.title,
t.is_completed AS "isCompleted",
t.priority,
t.created_at AS "createdAt",
t.user_id AS "userId",
u.name AS "user_name"
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.title ILIKE ${searchPattern}
OR u.name ILIKE ${searchPattern}
ORDER BY
CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startsWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
t.created_at DESC
LIMIT ${limit}`;

  const matchingTasks = await prisma.$queryRaw`
SELECT COUNT(t.id) AS "count"
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.title ILIKE ${searchPattern}
OR u.name ILIKE ${searchPattern}
`;

  return res.status(200).json({
    results: results,
    query: searchQuery,
    count: Number(matchingTasks[0].count)
  });
}

module.exports = {getUserAnalytics, getUsersWithStats, searchTasks};
