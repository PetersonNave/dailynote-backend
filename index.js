const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/meetings", async (req, res) => {
  const { participants, topics } = req.body;
 
  
  // Separar os IDs informados
  const allParticipantIds = participants
    .filter((p) => p.id)
    .map((p) => p.id);

  // Buscar participantes que realmente existem
  const existingParticipants = await prisma.participant.findMany({
    where: {
      id: { in: allParticipantIds },
    },
  });
  
  const participantsToConnect = existingParticipants.map((p) => ({ id: p.id }));
  const connectedIds = participantsToConnect.map(p => p.id);
  const participantsToCreate = participants.filter(
    (p) => !connectedIds.includes(p.id)
  );
 
  
  try {
    const meeting = await prisma.meeting.create({
      data: {
        participants: {
          create: participantsToCreate,
          connect: participantsToConnect,
        },
        topics: {
          create: topics,
        },
      },
      include: {
        participants: true,
        topics: true,
      },
    });

    res.json(meeting);
  } catch (error) {
    console.error("Erro ao criar reunião:", error);
    res.status(500).json({ error: "Erro ao criar reunião" });
  }
});


app.get("/meetings/:id", async (req, res) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    include: {
      participants: true,
      topics: true,
    },
  });

  if (!meeting) return res.status(404).json({ error: "Not found" });
  res.json(meeting);
});

app.get("/meetings", async (req, res) => {
  const meetings = await prisma.meeting.findMany({
    include: {
      participants: true,
      topics: true,
    },
  });

  res.json(meetings);
});

app.post("/finishMeeting", async (req, res) => {
  const { meetingId, duration, notes, decision, actions, feedbacks } = req.body;

  try {
    const finish = await prisma.finishMeeting.create({
      data: {
        meeting: { connect: { id: meetingId } },
        duration,
        notes,
        decision: JSON.stringify(decision),  
        actions:   JSON.stringify(actions),
        feedbacks: JSON.stringify(feedbacks),
      },
    });
    res.json({ id: finish.id });
  } catch (error) {
    console.error("Erro ao finalizar reunião:", error);
    res.status(500).json({ error: "Erro ao finalizar reunião" });
  }
});
app.get("/finishMeeting/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const finish = await prisma.finishMeeting.findUnique({
      where: { id },
    });
    if (!finish) {
      return res.status(404).json({ error: "FinishMeeting not found" });
    }
    res.json(finish);
  } catch (error) {
    console.error("Erro ao buscar FinishMeeting:", error);
    res.status(500).json({ error: "Erro ao buscar FinishMeeting" });
  }
});

// (Opcional) GET /finishMeeting → lista todos
app.get("/finishMeeting", async (req, res) => {
  try {
    const allFinishes = await prisma.finishMeeting.findMany();
    res.json(allFinishes);
  } catch (error) {
    console.error("Erro ao listar FinishMeetings:", error);
    res.status(500).json({ error: "Erro ao listar FinishMeetings" });
  }
});


app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

