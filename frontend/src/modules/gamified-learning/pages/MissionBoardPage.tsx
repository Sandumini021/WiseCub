
import { useState } from "react";
import { Card } from "../../../components/common/Card";


const missions = [
  {
    id: 1,
    title: "Saving Money",
    description: "Learn why saving money is important.",
    reward: 50,
  },
  {
    id: 2,
    title: "Smart Spending",
    description: "Understand needs and wants.",
    reward: 75,
  },
  {
    id: 3,
    title: "Budget Planning",
    description: "Learn how to manage a simple budget.",
    reward: 100,
  },
];

const [completedMissions, setCompletedMissions] = useState<number[]>([]);

const [totalCoins, setTotalCoins] = useState(0);

export function MissionBoardPage() {
  const [selectedMission, setSelectedMission] =
    useState<number | null>(null);

    const completeMission = (id: number) => {
  setCompletedMissions((previous) =>
    previous.includes(id) ? previous : [...previous, id]
  );

  if (!completedMissions.includes(id)) {
  const mission = missions.find((item) => item.id === id);

  if (mission) {
    setTotalCoins((previous) => previous + mission.reward);
  }
}
};

  return (
    <div>
      <p className="muted">Learn · Missions</p>
      <h1>Financial Learning Missions</h1>

      <p>
        Complete fun financial challenges and improve
        your money management knowledge.
      </p>

      <p>Virtual Coins Earned: {totalCoins}</p>

      <div style={{ display: "grid", gap: "16px" }}>
        {missions.map((mission) => (
          <Card key={mission.id} title={mission.title}>
            <p>{mission.description}</p>
            <p>Reward: {mission.reward} virtual coins</p>

            <button
              type="button"
              onClick={() => setSelectedMission(mission.id)}
            >
              {selectedMission === mission.id
                ? "Selected"
                : "Select Mission"}
            </button>

            <button
  type="button"
  onClick={() => completeMission(mission.id)}
  disabled={completedMissions.includes(mission.id)}
>
  {completedMissions.includes(mission.id)
    ? "Completed"
    : "Complete Mission"}
</button>

          </Card>
        ))}
      </div>
    </div>
  );
}
